export interface Note {
    id: string;
    title: string;
    content: string;
    summary?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}

export type NoteCreate = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;
export type NoteUpdate = Partial<NoteCreate> & { id: string };