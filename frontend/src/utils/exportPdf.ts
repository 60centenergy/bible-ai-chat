import html2pdf from 'html2pdf.js';
import { Chat } from '../types';

export async function exportChatToPdf(chat: Chat): Promise<void> {
  try {
    // Create HTML string with inline styles
    let htmlContent = `
      <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #1f2937; width: 100%; max-width: 800px; margin: 0 auto;">
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 8px 0; padding-bottom: 12px; border-bottom: 2px solid #1f2937; color: #1f2937;">
          ${escapeHtml(chat.title)}
        </h1>
        <div style="font-size: 12px; color: #6b7280; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
          ${chat.messages.length} messages • Exported ${new Date().toLocaleString()}
        </div>
    `;

    // Add messages
    chat.messages.forEach((message) => {
      const isUser = message.role === 'user';
      const roleText = isUser ? '👤 You' : '✝️ Bible AI';
      const roleColor = isUser ? '#3b82f6' : '#059669';
      const bgColor = isUser ? '#eff6ff' : '#f0fdf4';
      const borderColor = isUser ? '#3b82f6' : '#059669';
      const content = message.formattedContent || message.content;

      htmlContent += `
        <div style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="display: block; margin-bottom: 6px; font-size: 11px; font-weight: 600; color: ${roleColor}; text-transform: uppercase; letter-spacing: 0.3px;">
            ${roleText}
          </div>
          <div style="margin-bottom: 0; padding: 12px 14px; background-color: ${bgColor}; border-left: 3px solid ${borderColor}; border-radius: 4px; font-size: 13px; color: #1f2937; line-height: 1.6;">
            ${content}
          </div>
        </div>
      `;
    });

    htmlContent += `
        <div style="margin-top: 30px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center;">
          --- End of Conversation ---
        </div>
      </div>
    `;

    // Configure html2pdf options
    const options = {
      margin: [15, 10, 15, 10],
      filename: `${chat.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`,
      image: { type: 'png' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // Generate and save PDF using HTML string
    await (html2pdf() as any).set(options).from(htmlContent).save();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
