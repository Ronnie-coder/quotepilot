import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// FIX APPLIED: Removed top-level initialization to prevent build crashes

export async function POST(request: Request) {
  try {
    // FIX APPLIED: Initialize Resend inside the handler
    // This ensures it only runs at runtime, not build time.
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const { email, topic, message } = body;

    // 1. Validation check
    if (!email || !topic || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Dispatch via Resend
    // We send FROM 'support@coderon.co.za' to authenticate correctly.
    // We set 'reply_to' as the user's email, so you can reply directly from Zoho.
    const { data, error } = await resend.emails.send({
      from: 'QuotePilot Command <support@coderon.co.za>',
      to: ['support@coderon.co.za', 'ronnie@coderon.co.za'], // Hitting both your inboxes to be safe
      replyTo: email, 
      subject: `[Support - ${topic}] Message from ${email}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a202c;">
          <h2 style="color: #319795; margin-bottom: 20px;">New Transmission Received</h2>
          
          <p><strong>Pilot Identity:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Topic:</strong> ${topic}</p>
          
          <div style="background-color: #f7fafc; border-left: 4px solid #319795; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #718096;">
            System: QuotePilot v18<br/>
            Timestamp: ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}