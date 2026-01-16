import { api } from './client';

export interface ChatResponse {
    reply: string;
    conversationId: string;
}

export const chatService = {
    sendMessage: (message: string) =>
        api.post<ChatResponse>('/chat', { message }, { requiresAuth: true }),
};
