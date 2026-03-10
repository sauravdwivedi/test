import { Routes } from '@angular/router';
import { NoteListComponent } from './features/notes/note-list/note-list.component';

export const routes: Routes = [
    { path: '', component: NoteListComponent },
    { path: '**', redirectTo: '' }
];