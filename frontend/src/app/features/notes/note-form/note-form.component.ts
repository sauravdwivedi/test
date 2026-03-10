import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
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

  @Input() note: Note | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private noteService = inject(NoteService);

  loading = signal(false);

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1)]],
    content: ['', Validators.required]
  });

  ngOnInit() {
    if (this.note) {
      this.form.patchValue({
        title: this.note.title,
        content: this.note.content
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);

    const value = this.form.getRawValue(); // nonNullable → values are never null

    const obs = this.note
      ? this.noteService.updateNote({
        id: this.note.id,
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

  onCancel() {
    this.cancel.emit();
  }
}