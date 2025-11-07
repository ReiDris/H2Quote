const { createClient } = require('@supabase/supabase-js');
const pool = require('../config/database');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const replaceContextPlaceholders = (response, userContext) => {
  if (!userContext) return response;
  
  const isSystem = userContext.isAuthenticated === true || userContext.userType === 'system';
  
  const replacements = {
    '{SERVICES_URL}': isSystem ? '/customer/services' : '/services',
    '{SERVICES_LINK}': isSystem ? '[/customer/services|Services Page]' : '[/services|Services Page]',
    
    '{SIGNUP_STEP}': isSystem ? '' : '\n\n📝 **Step 3:** Sign up for an H2Quote account (if you haven\'t already)\n🔗 [/signup|Sign Up Here]',
    '{SIGNUP_NOTE}': isSystem ? '' : '\n(Skip this if you already have an account)',
    
    '{HOME_URL}': isSystem ? '/customer/services' : '/',
    
    '{PAGE_CONTEXT}': isSystem ? 'in your dashboard' : 'on our website',
  };
  
  let modifiedResponse = response;
  for (const [placeholder, replacement] of Object.entries(replacements)) {
    modifiedResponse = modifiedResponse.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  modifiedResponse = modifiedResponse.replace(/\n{3,}/g, '\n\n').trim();
  
  return modifiedResponse;
};

const startChatSession = async (req, res) => {
  try {
    const userId = req.user?.id || null; 
    const userIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const { userContext = {} } = req.body;

    const { data: session, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId,
        user_ip: userIP,
        user_agent: userAgent,
        metadata: {
          user_context: userContext,
          failed_attempts: 0
        }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from('chat_analytics')
      .insert({
        session_id: session.session_id,
        event_type: 'session_start',
        event_data: { 
          user_agent: userAgent, 
          ip: userIP,
          is_authenticated: userContext.isAuthenticated || false,
          user_type: userContext.userType || 'public'
        }
      });

    res.json({
      success: true,
      data: {
        sessionId: session.session_id,
        message: 'Chat session started successfully'
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start chat session'
    });
  }
};

const sendMessage = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { sessionId, message, messageType = 'user' } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and message are required'
      });
    }

    const sessionCheck = await client.query(
      'SELECT session_id, is_active, metadata FROM chat_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found'
      });
    }

    if (!sessionCheck.rows[0].is_active) {
      return res.status(400).json({
        success: false,
        message: 'Chat session is no longer active'
      });
    }

    let sessionMetadata = sessionCheck.rows[0].metadata || {};
    let failedAttempts = sessionMetadata.failed_attempts || 0;
    const userContext = sessionMetadata.user_context || {};

    const userMessageResult = await client.query(`
      INSERT INTO chat_messages (session_id, message_type, content)
      VALUES ($1, $2, $3)
      RETURNING message_id, created_at
    `, [sessionId, messageType, message]);

    const userMessage = userMessageResult.rows[0];

    let botResponse;
    let responseMetadata = {};
    const isQuickAction = ['Types of Services', 'Request a Service', 'Payment Options', 'Pricing Info'].includes(message);

    if (isQuickAction) {
      const quickActionResult = await client.query(
        'SELECT response_text FROM chat_quick_actions WHERE action_text = $1 AND is_active = TRUE',
        [message]
      );
      
      if (quickActionResult.rows.length > 0) {
        botResponse = quickActionResult.rows[0].response_text;
        responseMetadata.is_quick_action = true;
        failedAttempts = 0;
      } else {
        const responseData = await getBotResponse(client, message);
        botResponse = responseData.response;
        if (responseData.is_fallback) {
          failedAttempts++;
        }
      }
    } else {
      const responseData = await getBotResponse(client, message);
      botResponse = responseData.response;
      
      if (responseData.is_fallback) {
        failedAttempts++;
        responseMetadata.is_fallback = true;
        responseMetadata.attempt_number = failedAttempts;
        
        if (failedAttempts >= 3) {
          const contactResponse = await client.query(
            `SELECT responses FROM chat_intents WHERE intent_name = 'fallback_contact' AND is_active = TRUE LIMIT 1`
          );
          
          if (contactResponse.rows.length > 0) {
            const responses = contactResponse.rows[0].responses;
            botResponse = responses[Math.floor(Math.random() * responses.length)];
          }
          
          failedAttempts = 0;
        }
      } else {
        failedAttempts = 0;
      }
    }

    botResponse = replaceContextPlaceholders(botResponse, userContext);

    sessionMetadata.failed_attempts = failedAttempts;
    await client.query(
      'UPDATE chat_sessions SET metadata = $1 WHERE session_id = $2',
      [JSON.stringify(sessionMetadata), sessionId]
    );

    const botMessageResult = await client.query(`
      INSERT INTO chat_messages (session_id, message_type, content, metadata)
      VALUES ($1, 'bot', $2, $3)
      RETURNING message_id, created_at
    `, [
      sessionId, 
      botResponse, 
      JSON.stringify(responseMetadata)
    ]);

    const botMessage = botMessageResult.rows[0];

    await client.query(
      'UPDATE chat_sessions SET total_messages = total_messages + 2 WHERE session_id = $1',
      [sessionId]
    );

    await client.query(`
      INSERT INTO chat_analytics (session_id, event_type, event_data)
      VALUES 
        ($1, 'message_sent', $2),
        ($1, 'bot_response', $3)
    `, [
      sessionId,
      JSON.stringify({ message_type: messageType, content_length: message.length }),
      JSON.stringify({ response_length: botResponse.length, ...responseMetadata })
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        userMessage: {
          id: userMessage.message_id,
          text: message,
          sender: 'user',
          timestamp: userMessage.created_at
        },
        botMessage: {
          id: botMessage.message_id,
          text: botResponse,
          sender: 'bot',
          timestamp: botMessage.created_at
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  } finally {
    client.release();
  }
};

const getBotResponse = async (client, userInput) => {
  try {
    const result = await client.query('SELECT get_chatbot_response($1) as response', [userInput]);
    const response = result.rows[0].response;
    
    const isFallback = response.includes("I'm sorry, I'm having trouble processing");
    
    return {
      response: response,
      is_fallback: isFallback
    };
  } catch (error) {
    return {
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact our support team directly.",
      is_fallback: true
    };
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('message_id, message_type, content, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw error;
    }

    const formattedMessages = messages.map(msg => ({
      id: msg.message_id,
      text: msg.content,
      sender: msg.message_type,
      timestamp: msg.created_at
    }));

    res.json({
      success: true,
      data: {
        messages: formattedMessages
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history'
    });
  }
};

const endChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        is_active: false, 
        session_end: new Date().toISOString() 
      })
      .eq('session_id', sessionId);

    if (error) {
      throw error;
    }

    await supabase
      .from('chat_analytics')
      .insert({
        session_id: sessionId,
        event_type: 'session_end',
        event_data: { ended_by: 'user' }
      });

    res.json({
      success: true,
      message: 'Chat session ended successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to end chat session'
    });
  }
};

const getQuickActions = async (req, res) => {
  try {
    const { data: actions, error } = await supabase
      .from('chat_quick_actions')
      .select('action_id, action_text')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: actions
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get quick actions'
    });
  }
};

const getChatAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    let query = supabase
      .from('chat_analytics')
      .select(`
        analytics_id,
        session_id,
        event_type,
        event_data,
        created_at,
        chat_sessions!inner(user_id, session_start, total_messages)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: analytics, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get chat analytics'
    });
  }
};

const updateChatIntent = async (req, res) => {
  try {
    const { intentId } = req.params;
    const { intent_name, description, keywords, responses, is_active, priority } = req.body;

    const { error } = await supabase
      .from('chat_intents')
      .update({
        intent_name,
        description,
        keywords,
        responses,
        is_active,
        priority,
        updated_at: new Date().toISOString()
      })
      .eq('intent_id', intentId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Chat intent updated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update chat intent'
    });
  }
};

module.exports = {
  startChatSession,
  sendMessage,
  getChatHistory,
  endChatSession,
  getQuickActions,
  getChatAnalytics,
  updateChatIntent
};