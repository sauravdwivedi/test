export interface Note {
    id: string;
    title: string;
    content: string;
    summary?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
}
export interface NoteCreate {
    title: string;
    content: string;
}

export type NoteUpdate = Partial<NoteCreate> & { id: string };