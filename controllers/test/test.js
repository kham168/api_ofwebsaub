import { generateJwt } from "../../utils/test_jwt.js";

export const sendWhatsasppMessage = async (req, res) => {
  const msisdn = req.body.msisdn;

  try {
    const jwtToken = generateJwt();

    const response = await fetch("https://api.nexmo.com/v1/messages", {
      
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "12019322742",
        to: msisdn,
        channel: "whatsapp",
        message_type: "custom",
        custom: {
          type: "template",
          template: {
            name: "tplus_digital",
            language: { policy: "deterministic", code: "en" },
            components: [
              {
                type: "header",
                parameters: [
                  {
                    type: "image",
                    image: {
                      link: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbgunZA_YmRCASvTWtQ_ueQQqSTXTh2UjzfQ&s',
                    },
                  },
                ],
              },
            ],
          },
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      return res
        .status(200)
        .json({ message: "WhatsApp message sent successfully", data: result });
    } else {
      return res
        .status(response.status)
        .json({ error: "Failed to send message", details: result });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
};


export const sendWhatsappMessaged = async (req, res) => {
 
     const msisdn = req.body.msisdn

  try {
    const response = await fetch('https://api.nexmo.com/v1/messages', {
      //  const response = await fetch('https://messages-sandbox.nexmo.com/v0.1/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NjU0Mjg4MDEsImV4cCI6MTc5Njg3ODQwMSwianRpIjoiVjdZdkhwRzUyVW1vIiwiYXBwbGljYXRpb25faWQiOiI2M2JhZjZhZS1iYmQ2LTQ0ZGItYTE3Ni1hZDcyZjcyOWFlZGYiLCJzdWIiOiIiLCJhY2wiOiIifQ.lxOVGULzx0FjUw3Yi2e0OycJr1GbA_7_iH7KQ4jIWOq_sHVz2WyfgMqbbDu6HU8-fjCh5Uwf_KLZEtQrFfaPcMXqmuE_IkXzEam12d_O_SMDa58WOEatJJoemXDXQCsLxMI2joNmaAbtRkfQsnu9A2P7LF-LTU1kcFPSROkcgj9Ofb4f83yQMYQYAHFEri3oQSsvNHhIRyCnbHEAqpVvNamFK3XrNJDv_ZT_tVubVU1XMpaQZbQMd_qHOkf-V9lWCbo5qDvdcNsHAjWZipzStf2Y5STDwO-MXlynupHjI60FDiXPzHUoHICDt1lvnMQ8fod1rkGA3wh1PBKWNSc4iQ',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ // 12019322742  // 8562077771624
        from: '12019322742',
        to: msisdn,
        channel: 'whatsapp',
        message_type: 'custom',
        custom: {
          type: 'template',
          template: {
            name: 'tplus_digital',
            language: {
              policy: 'deterministic',
              code: 'en'
            },
            components: [
              {
                type: 'header',
                parameters: [
                  {
                    type: 'image',
                    image: {
                      link: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbgunZA_YmRCASvTWtQ_ueQQqSTXTh2UjzfQ&s'
                    }
                  }
                ]
              }
            ]
          }
        }
      })
    });

    const result = await response.json();

    // Handle success or failure
    if (response.ok) {
      return res.status(200).json({ message: 'WhatsApp message sent successfully', data: result });
    } else {
      return res.status(response.status).json({ error: 'Failed to send message', details: result });
    }

  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
