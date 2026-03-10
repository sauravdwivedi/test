import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Note } from '../../../core/models/note.model';
import { NoteService } from '../../../core/services/note.service';
import { NoteCardComponent } from '../note-card/note-card.component';
import { NoteFormComponent } from '../note-form/note-form.component';

@Component({
    selector: 'app-note-list',
    standalone: true,
    imports: [CommonModule, FormsModule, NoteCardComponent, NoteFormComponent],
    templateUrl: './note-list.component.html',
})
export class NoteListComponent {
    public noteService = inject(NoteService);

    searchTerm = signal('');
    selectedNote = signal<Note | null>(null);
    showForm = signal(false);

    notes = this.noteService.notes;
    loading = this.noteService.loading;
    error = this.noteService.error;

    constructor() {
        this.noteService.loadNotes();
    }

    trackById(index: number, note: Note) {
        return note.id;
    }

    onSearch(sortValue?: string) {
        const sort = sortValue ?? '';
        const [sortField, sortOrder] = sort.split('_');
        this.noteService.loadNotes(
            this.searchTerm(),
            sortField || 'createdAt',
            (sortOrder as 'asc' | 'desc') || 'desc'
        );
    }

    openCreate() {
        this.selectedNote.set(null);
        this.showForm.set(true);
    }

    openEdit(note: Note) {
        this.selectedNote.set(note);
        this.showForm.set(true);
    }

    closeForm() {
        this.showForm.set(false);
        this.selectedNote.set(null);
    }

    onSaved() {
        this.closeForm();
        this.noteService.loadNotes(this.searchTerm());
    }

    onDeleted() {
        this.noteService.loadNotes(this.searchTerm());
    }
}