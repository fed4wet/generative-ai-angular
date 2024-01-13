import {Component, EventEmitter, HostListener, Output} from '@angular/core';
import {ContentChange} from 'ngx-quill';
import {DeltaStatic, Quill} from 'quill';
import './quill-label.blot';
import './quill-warning.blot';
import './quill-text-only.clipboard';
import './quill-markdown.module';
import {promptIdeas as PROMPTS} from './prompt-ideas'
import QuillMarkdown from 'quilljs-markdown';

@Component({
  selector: 'app-rich-text-editor',
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.scss']
})
export class RichTextEditorComponent {
  quillInstance!: Quill;
  quillMarkDown!: any;
  @Output() editorEmpty: EventEmitter<boolean> = new EventEmitter<boolean>();
  isEditorEmpty = true;
  @Output() speakerClicked: EventEmitter<void> = new EventEmitter<void>();
  lastIdea = "";
  ideasArray = PROMPTS;
  usedIndices: number[] = [];
  timeoutId: any | undefined;
  playing: boolean = false;

  quillConfiguration = {
    toolbar: false,
    /*     QuillMarkdown: {
          ignoreTags: [],
          tags: { },
        }, */
    PlainClipboard: false
    //clipboard: true,
  }

  editorCreated(quill: Quill) {
    this.quillInstance = quill;
    this.quillInstance.focus();
    this.switchIdea();

    this.quillMarkDown = new QuillMarkdown(quill);
  }

  switchIdea() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    const ideasCopy = [...this.ideasArray];
    const remainingIdeas = ideasCopy.filter((_, i) => {
      return !this.usedIndices.includes(i);
    });
    const newIndex = Math.floor(Math.random() * remainingIdeas.length);

    // Get new idea and update tracking
    const newIdea = remainingIdeas[newIndex];
    this.usedIndices.push(newIndex);

    // reset when done through it all
    if (this.usedIndices.length === this.ideasArray.length) {
      this.usedIndices = [];
    }

    // Set placeholder
    this.quillInstance.root.dataset['placeholder'] = newIdea;
    this.lastIdea = newIdea;

    // Recursively call again after delay
    this.timeoutId = setTimeout(() => {
      if (this.editorEmpty) {
        this.switchIdea();
      }
      this.timeoutId = undefined;
    }, 3000);
  }

  @HostListener('keydown.tab', ['$event'])
  onTabKeydown(event: any) {
    if (this.isEditorEmpty) {
      this.quillInstance.setText(this.lastIdea);
      this.quillInstance.setSelection(this.lastIdea.length, 0);
      this.quillInstance.update();
      event.stopPropagation();
    }
  }

  extractPrompt(): string {
    let text: string = '';
    const ops: DeltaStatic = this.quillInstance.getContents();
    ops.forEach((op: any) => {
      if (op.insert?.label) {
        text += '\n\n' + op.insert.label + '\n\n';
      } else if (op.insert) {
        text += op.insert;
      }
    });
    return text.trim().substring(0, 8196);
  }

  insertAndFormatMarkdown(text: string, error: boolean = false) {


    text = `\n${text}\n`;
    const range = this.quillInstance.getSelection();
    if (range) {
      if (range.length > 0) return; // range selected ignore
      const index = range.index;
      const length = text.length;

      this.quillInstance.insertText(index, text, 'api');
      this.quillInstance.update('api');

      if (error) {
        this.quillInstance.formatText(index, length - 1, {
          'background-color': 'rgb(200, 0, 0)'
        });
      } else {
        this.quillInstance.formatText(index, length - 1, {
          'background-color': 'rgb(200, 200, 200)'
        });
      }
      this.quillInstance.update('api');

      this.quillInstance.insertText(index + length, '\n');
      this.quillInstance.setSelection(index + length, 0, 'api');
    }
  }



  clear(): void {
    if (this.quillInstance) {
      this.quillInstance.setText('');
      this.quillInstance.focus();
    }
    this.switchIdea();
  }

  contentChanged(change: ContentChange): void {
    const isEmpty = change.text.trim().length === 0;
    if (this.isEditorEmpty !== isEmpty) {
      this.isEditorEmpty = isEmpty;
      this.editorEmpty.emit(isEmpty);
    }
  }

  onSpeakerClick(): void {
    this.speakerClicked.emit();
  }
}
