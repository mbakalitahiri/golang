export interface NoteBlock {
  type: string;
  data: {
    text?: string;
  };
}

export interface Note {
  id: string;
  title: string;
  categoryId: string;
  date: string;
  content: {
    blocks: NoteBlock[];
  };
}
