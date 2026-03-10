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
        // Initial load
        this.noteService.setSearch('');
    }

    onSearch() {
        this.noteService.setSearch(this.searchTerm());
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
        // Refresh list
        this.noteService.setSearch(this.searchTerm());
    }

    onDeleted() {
        this.noteService.setSearch(this.searchTerm());
    }
}