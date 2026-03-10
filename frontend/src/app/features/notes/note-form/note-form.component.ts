import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Note } from '../../../core/models/note.model';
import { NoteService } from '../../../core/services/note.service';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './note-form.component.html',
})
export class NoteFormComponent implements OnInit {
  @Input() note: Note | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  loading = false;

  form: any; // will initialize in ngOnInit

  constructor(private fb: FormBuilder, private noteService: NoteService) { }

  ngOnInit() {
    this.form = this.fb.nonNullable.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      content: ['', Validators.required],
    });

    if (this.note) {
      this.form.patchValue({
        title: this.note.title,
        content: this.note.content,
      });
    }
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    const value = this.form.getRawValue();

    const obs = this.note
      ? this.noteService.updateNote({
        id: this.note.id,
        title: value.title,
        content: value.content,
      })
      : this.noteService.createNote({
        title: value.title,
        content: value.content,
      });

    obs.subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (err: unknown) => {
        this.loading = false;
        console.error('Save failed', err);
        alert('Error saving note');
      },
    });
  }
}