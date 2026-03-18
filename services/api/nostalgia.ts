import { api } from './client';

export interface NostalgiaMemory {
  id: string;
  userId: string;
  prompt: string;
  transcript: string;
  audioUrl?: string;
  themes?: string[];
  recordedAt: string;
}

export const nostalgiaService = {
  getPrompt: async (): Promise<{ prompt: string }> => {
    const response = await api.get<{ data: { prompt: string } }>('/v1/nostalgia/prompt');
    return response.data;
  },

  saveMemory: async (
    prompt: string,
    transcript: string,
    audioUri?: string
  ): Promise<NostalgiaMemory> => {
    if (audioUri) {
      // Create form data for multipart upload
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('transcript', transcript);
      
      const filename = audioUri.split('/').pop() || 'recording.m4a';
      const ext = filename.split('.').pop();
      const type = ext ? `audio/${ext}` : `audio/m4a`;

      // @ts-ignore - React Native FormData accepts an object with uri, type, name
      formData.append('audioFile', {
        uri: audioUri,
        name: filename,
        type,
      });

      const response = await api.post<{ data: { memory: NostalgiaMemory } }>(
        '/v1/nostalgia/memory', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.memory;
    } else {
      // Just send the text if no audio
      const response = await api.post<{ data: { memory: NostalgiaMemory } }>(
        '/v1/nostalgia/memory', 
        { prompt, transcript }
      );
      return response.data.memory;
    }
  },

  getTimeline: async (userId: string): Promise<NostalgiaMemory[]> => {
    const response = await api.get<{ data: { timeline: NostalgiaMemory[] } }>(`/v1/nostalgia/timeline/${userId}`);
    return response.data.timeline;
  },
};
