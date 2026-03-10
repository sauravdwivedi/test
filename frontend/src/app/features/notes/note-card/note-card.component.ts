import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Note } from '../../../core/models/note.model';
import { NoteService } from '../../../core/services/note.service';

@Component({
  selector: 'app-note-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white border rounded-lg shadow-sm p-5 hover:shadow-md transition">
      <h3 class="text-xl font-semibold mb-2">{{ note.title }}</h3>
      <p class="text-gray-600 mb-3 line-clamp-3">{{ note.content }}</p>

      <p *ngIf="note.summary" class="text-sm text-gray-500 italic mb-3">
        "{{ note.summary }}"
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        <span *ngFor="let tag of note.tags || []" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
          {{ tag }}
        </span>
      </div>

      <div class="flex justify-between text-sm text-gray-500">
        <span>{{ note.updatedAt | date:'short' }}</span>
        <div class="space-x-3">
          <button (click)="edit.emit(note)" class="text-blue-600 hover:underline">Edit</button>
          <button (click)="summarize()" class="text-purple-600 hover:underline">Summarize</button>
          <button (click)="deleteNote()" class="text-red-600 hover:underline">Delete</button>
        </div>
      </div>
    </div>
  `
})
export class NoteCardComponent {
  @Input() note!: Note;
  @Output() edit = new EventEmitter<Note>();
  @Output() delete = new EventEmitter<void>();

  private noteService = inject(NoteService);

  summarize() {
    this.noteService.summarizeNote(this.note.id).subscribe({
      next: updatedNote => {
        // No need to emit delete; the service updates the notes signal
        console.log('Summarized note:', updatedNote);
      },
      error: (err: unknown) => console.error('Summarize failed', err)
    });
  }

  deleteNote() {
    if (confirm('Delete this note?')) {
      this.noteService.deleteNote(this.note.id).subscribe({
        next: () => this.delete.emit(),
        error: (err: unknown) => console.error('Delete failed', err)
      });
    }
  }
}