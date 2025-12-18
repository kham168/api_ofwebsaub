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
        'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NjU3NjY4MTUsImV4cCI6MTc3MDk1MDgxNSwianRpIjoiRHVSSHIwb2UwdGFvIiwiYXBwbGljYXRpb25faWQiOiI2M2JhZjZhZS1iYmQ2LTQ0ZGItYTE3Ni1hZDcyZjcyOWFlZGYiLCJzdWIiOiIiLCJhY2wiOiIifQ.JWr6DDw0wdnI8-azCIk5PcSCZIaKBgZ2xVQ8u79i9vliFYOXeXIeVUccg5p2r2yTBgHYr8hHs9oRhvgEYLnXMN2EMrgF8mN5vXwAN_rkl-p0n07rsAfLdK11KvlZNqjyV9M-q3ZFLAgykK5d_xTtFSz3OfNK-NExVovVt3PRJAtAxlyOFm743sMpRg5XgQBHgCwchwUuPmwGbYgNZvy56NkBXkO4Z7VFBwvzCEHGdpbQUAzOLMdVKkuijtf8OYLM9U4Qw4-H6k7_k8iejq4gJSVHPnYWuzsPauwgLxqW9vSRscAklMul6WXjryB5NA0YYI__h6mNZgPspmlI-XLQmQ',
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
