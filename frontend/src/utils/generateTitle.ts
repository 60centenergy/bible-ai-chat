export function generateChatTitle(userMessage: string): string {
  // Use full message as title (up to 200 characters), no ellipsis
  // Adaptive font sizing in CSS will handle fitting long titles
  const cleanMessage = userMessage.replace(/\n/g, ' ').trim();
  const title = cleanMessage.length > 200 
    ? cleanMessage.substring(0, 200) 
    : cleanMessage;
  return title || 'New Chat';
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
