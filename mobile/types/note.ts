export type NoteStatus = 'active' | 'archived' | 'deleted';

export interface Note {
  id: string;
  localId: string;
  title: string;
  body: string;
  subject: string;
  tags: string[];
  favorite: boolean;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerCard {
  id: string;
  noteId: string;
  assignedDay: number; // 0 = Segunda … 6 = Domingo
  completed: boolean;
  createdAt: string;
}

export interface ReviewDate {
  id: string;
  noteId: string;
  dueDate: string;
  done: boolean;
}

export interface CreateNoteInput {
  title: string;
  body: string;
  subject: string;
  tags: string[];
  favorite?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  subject?: string;
  tags?: string[];
  favorite?: boolean;
  status?: NoteStatus;
}
