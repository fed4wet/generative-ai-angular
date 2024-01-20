export interface ChatMessage {
  id: string,
  text: string,
  sender: string,
  avatar: string,
  isRaw?: boolean,
}
