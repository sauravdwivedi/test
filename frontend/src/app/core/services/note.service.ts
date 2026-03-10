import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { Note, NoteCreate, NoteUpdate } from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api/notes';

    private searchTerm$ = new BehaviorSubject<string>('');

    // Reactive notes list with search & sort
    notes = toSignal(
        this.searchTerm$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            switchMap(term => this.getNotes(term))
        ),
        { initialValue: [] as Note[] }
    );

    loading = signal(false);
    error = signal<string | null>(null);

    setSearch(term: string) {
        this.searchTerm$.next(term);
    }

    private getNotes(search = '', sort = 'createdAt', order: 'asc' | 'desc' = 'desc'): Observable<Note[]> {
        this.loading.set(true);
        this.error.set(null);

        return this.http.get<Note[]>(this.apiUrl, {
            params: { search, sort, order }
        }).pipe(
            tap(() => this.loading.set(false)),
            map(notes => notes ?? []),
            // You can add client-side sort if backend doesn't support
        );
    }

    createNote(note: NoteCreate): Observable<Note> {
        return this.http.post<Note>(this.apiUrl, note);
    }

    updateNote(note: NoteUpdate): Observable<Note> {
        return this.http.put<Note>(`${this.apiUrl}/${note.id}`, note);
    }

    deleteNote(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    summarizeNote(id: string): Observable<Note> {
        return this.http.post<Note>(`${this.apiUrl}/${id}/summarize`, {});
    }
}