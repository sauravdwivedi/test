import { CommonModule } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Note } from '../../../core/models/note.model';
import { NoteService } from '../../../core/services/note.service';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `...` // keep your existing template
})
export class NoteFormComponent {
  note = input<Note | null>(null);
  saved = output<void>();
  cancel = output<void>();

  private fb = inject(FormBuilder);
  private noteService = inject(NoteService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    content: ['', Validators.required]
  });

  ngOnInit() {
    const currentNote = this.note();
    if (currentNote) {
      this.form.patchValue({
        title: currentNote.title,
        content: currentNote.content
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);

    const value = this.form.getRawValue(); // nonNullable group → no nulls

    const obs = this.note()
      ? this.noteService.updateNote({
        id: this.note()!.id,
        title: value.title,
        content: value.content
      })
      : this.noteService.createNote({
        title: value.title,
        content: value.content
      });

    obs.subscribe({
      next: () => {
        this.loading.set(false);
        this.saved.emit();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        console.error('Save failed', err);
        alert('Error saving note');
      }
    });
  }
}