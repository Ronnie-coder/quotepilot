import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// FIX APPLIED: Removed top-level initialization to prevent build crashes

export async function POST(request: Request) {
  try {
    // FIX APPLIED: Initialize Resend inside the handler
    // This ensures it only runs at runtime, not build time.
    const body = await request.json();
    const { email, topic, message } = body ?? {};

    // 1. Validation check (this form is public, so check types and sizes)
    if ([email, topic, message].some((v) => typeof v !== 'string' || !v.trim())) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || topic.length > 80 || message.length > 5000) {
      return NextResponse.json({ error: 'Please check your email address and keep the message under 5000 characters.' }, { status: 400 });
    }
    // Everything the visitor typed is escaped before it goes into the HTML email.
    const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    const safeEmail = esc(email.trim());
    const safeTopic = esc(topic.replace(/[\r\n]+/g, ' ').trim());
    const safeMessage = esc(message.trim()).replace(/\n/g, '<br>');

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 2. Dispatch via Resend
    // We send FROM 'support@coderon.co.za' to authenticate correctly.
    // We set 'reply_to' as the user's email, so you can reply directly from Zoho.
    const { data, error } = await resend.emails.send({
      from: 'QuotePilot Command <support@coderon.co.za>',
      to: ['support@coderon.co.za', 'ronnie@coderon.co.za'], // Hitting both your inboxes to be safe
      replyTo: email.trim(), 
      subject: `[Support - ${topic.replace(/[\r\n]+/g, ' ').slice(0, 80)}] Message from ${email.trim()}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #1a202c;">
          <h2 style="color: #319795; margin-bottom: 20px;">New Transmission Received</h2>
          
          <p><strong>Pilot Identity:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          <p><strong>Topic:</strong> ${safeTopic}</p>
          
          <div style="background-color: #f7fafc; border-left: 4px solid #319795; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6;">${safeMessage}</p>
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