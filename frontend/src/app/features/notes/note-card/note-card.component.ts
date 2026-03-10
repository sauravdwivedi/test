import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Note } from '../../../core/models/note.model';
import { NoteService } from '../../../core/services/note.service';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './note-card.component.html',
})
export class NoteCardComponent {
  @Input() note!: Note;
  @Output() edit = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<void>();

  private noteService = inject(NoteService);

  summarize() {
    this.noteService.summarizeNote(this.note.id).subscribe({
      next: () => this.edit.emit(), // optionally you can reload notes
      error: (err) => console.error('Summarize failed', err),
    });
  }

  deleteNote() {
    if (confirm('Delete this note?')) {
      this.noteService.deleteNote(this.note.id).subscribe({
        next: () => this.delete.emit(),
        error: (err) => console.error('Delete failed', err),
      });
    }
  }

  onEdit() {
    this.edit.emit(this.note);
  }
}