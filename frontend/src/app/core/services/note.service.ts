import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, tap } from 'rxjs';

import { Note, NoteCreate, NoteUpdate } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {

    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api/notes';

    notes = signal<Note[]>([]);
    loading = signal(false);
    error = signal<string | null>(null);

    constructor() {
        this.loadNotes();
    }

    loadNotes(
        search = '',
        sort = 'createdAt',
        order: 'asc' | 'desc' = 'desc'
    ) {
        this.loading.set(true);
        this.error.set(null);

        this.http.get<Note[]>(this.apiUrl, {
            params: { search, sort, order }
        }).pipe(
            finalize(() => this.loading.set(false))
        ).subscribe({
            next: notes => this.notes.set(notes ?? []),
            error: () => this.error.set('Failed to load notes')
        });
    }

    createNote(note: NoteCreate): Observable<Note> {
        this.loading.set(true);

        return this.http.post<Note>(this.apiUrl, note).pipe(
            tap(created => {
                this.notes.update(notes => [created, ...notes]);
            }),
            finalize(() => this.loading.set(false))
        );
    }

    updateNote(note: NoteUpdate): Observable<Note> {
        this.loading.set(true);

        return this.http.put<Note>(`${this.apiUrl}/${note.id}`, note).pipe(
            tap(updated => {
                this.notes.update(notes =>
                    notes.map(n => n.id === updated.id ? updated : n)
                );
            }),
            finalize(() => this.loading.set(false))
        );
    }

    deleteNote(id: string): Observable<void> {
        this.loading.set(true);

        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                this.notes.update(notes => notes.filter(n => n.id !== id));
            }),
            finalize(() => this.loading.set(false))
        );
    }

    summarizeNote(id: string): Observable<Note> {
        this.loading.set(true);

        return this.http.post<Note>(`${this.apiUrl}/${id}/summarize`, {}).pipe(
            tap(updated => {
                this.notes.update(notes =>
                    notes.map(n => n.id === updated.id ? updated : n)
                );
            }),
            finalize(() => this.loading.set(false))
        );
    }
}