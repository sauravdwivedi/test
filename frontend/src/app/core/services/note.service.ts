import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, of } from 'rxjs';
import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    finalize,
    map,
    switchMap
} from 'rxjs/operators';

import { Note, NoteCreate, NoteUpdate } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {

    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api/notes';

    private searchTerm$ = new BehaviorSubject<string>('');

    loading = signal(false);
    error = signal<string | null>(null);

    // Reactive notes list with search
    notes = toSignal(
        this.searchTerm$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.getNotes(term))
        ),
        { initialValue: [] as Note[] }
    );

    setSearch(term: string) {
        this.searchTerm$.next(term);
    }

    private getNotes(
        search = '',
        sort = 'createdAt',
        order: 'asc' | 'desc' = 'desc'
    ): Observable<Note[]> {

        this.loading.set(true);
        this.error.set(null);

        return this.http.get<Note[]>(this.apiUrl, {
            params: { search, sort, order }
        }).pipe(
            map(notes => notes ?? []),
            catchError(() => {
                this.error.set('Failed to load notes');
                return of([]);
            }),
            finalize(() => this.loading.set(false))
        );
    }

    createNote(note: NoteCreate): Observable<Note> {
        this.loading.set(true);

        return this.http.post<Note>(this.apiUrl, note).pipe(
            finalize(() => this.loading.set(false))
        );
    }

    updateNote(note: NoteUpdate): Observable<Note> {
        this.loading.set(true);

        return this.http.put<Note>(`${this.apiUrl}/${note.id}`, note).pipe(
            finalize(() => this.loading.set(false))
        );
    }

    deleteNote(id: string): Observable<void> {
        this.loading.set(true);

        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            finalize(() => this.loading.set(false))
        );
    }

    summarizeNote(id: string): Observable<Note> {
        this.loading.set(true);

        return this.http.post<Note>(`${this.apiUrl}/${id}/summarize`, {}).pipe(
            finalize(() => this.loading.set(false))
        );
    }
}