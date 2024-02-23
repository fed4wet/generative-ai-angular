import {AfterViewChecked, Component, ElementRef, OnInit, ViewChild} from '@angular/core';

import {KatexOptions, MarkdownComponent} from 'ngx-markdown';
import {ClipboardButtonComponent} from '../ui-kit/clipboard-button/clipboard-button.component';
import * as uuid from 'uuid';
import {
  ChatSession,
  EnhancedGenerateContentResponse,
  GenerateContentResult,
  GenerationConfig,
  GenerativeModel,
  GoogleGenerativeAI,
  InputContent,
} from "@google/generative-ai";
import {environment} from '../../environments/environment.development';
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {ProcessCodeBlocksPipe} from "../pipes/process-code-block.pipe";
import {MermaidService} from "../mermaid/mermaid.service";
import {ChatMessage} from "../types/message-chat.type";


@Component({
  selector: 'chat',
  templateUrl: './chat.component.html',
  standalone: true,
  imports: [
    FormsModule,
    MatInputModule,
    ProcessCodeBlocksPipe,
    MatProgressSpinnerModule,
    NgIf,
    MarkdownComponent,
    NgStyle,
    MatIconModule,
    MatButtonModule,
    NgForOf,
    ReactiveFormsModule
  ],
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('bottom') bottom!: ElementRef;
  @ViewChild('scroll') scroll!: ElementRef;
  readonly clipboardButton = ClipboardButtonComponent;
  messages: ChatMessage[] = [];
  input: FormControl<string | null> = new FormControl<string>("");
  MAX_INPUT_SIZE_BYTES: number = 30720;
  geminiModel!: GenerativeModel;
  chat!: ChatSession;
  loading: boolean = false;
  katexOptions: KatexOptions = {
    displayMode: true,
    throwOnError: false
  };
  navigator: any = window.navigator;

  private encoder: TextEncoder = new TextEncoder();
  private decoder: TextDecoder = new TextDecoder();

  constructor(public mermaidService: MermaidService) {
  }


  ngOnInit(): void {
    this.geminiInit();
    this.geminiChatInit();
    this.addUserMessageToUI(this.mermaidService.diagrams);
  }

  ngAfterViewChecked(): void {
    document.querySelectorAll("[class^=node-icon-]").forEach((elem: Element) => {
      elem.className = elem.className.replace(/\s/g, ' ');
    })
  }


  geminiChatInit(): void {
    const generationConfig: GenerationConfig = {
      temperature: 0.5,
      topP: 0.1,
      topK: 16,
      maxOutputTokens: 2048
    }

    this.chat = this.geminiModel.startChat({
      history: this.getInitialHistory(),
      generationConfig
    });
  }


  geminiInit(): void {
    const genAI: GoogleGenerativeAI = new GoogleGenerativeAI(environment.API_KEY);
    this.geminiModel = genAI.getGenerativeModel({model: "gemini-pro"});
  }


  getInitialHistory(): InputContent[] {
    return [
      {
        role: "user",
        parts: "All text in YOUR answers should be in `UPPER CASE` and in French language",
      },
      {
        role: "model",
        parts: "Understood.",
      }
    ]
  }

  async handleUserMessage(event: Event): Promise<void> {

    const value: string = this.input.value ?? '';

    if (!value.trim()) {
      event.preventDefault();
      return;
    }

    await this.processAndSendUserMessage(value).then(() => this.input.setValue(null));
  }

  public async processAndSendUserMessage(text: string): Promise<void> {
    const processedText: string = this.processText(text);
    this.addUserMessageToUI(processedText);
    await this.sendTextToChatService(text);
  }


  private processText(text: string): string {
    return text.split(/(```[^`]+```)/)
      .map((section: string, index: number) => index % 2 === 0 ? section.replace(/\n/g, "<br>") : section)
      .join('');
  }

  private addUserMessageToUI(processedText: string): void {
    this.messages.push({
      id: uuid.v4(),
      text: processedText,
      sender: '@fed4wet',
      avatar: "https://media.licdn.com/dms/image/D4D03AQG5DE3yJNcNPA/profile-displayphoto-shrink_800_800/0/1676575729872?e=1710374400&v=beta&t=rnJdhNttPWGa29hGpO3bWtCUCF_GUcONYg3IJ3chmyc",
    });
    this.scrollToBottom();
  }

  private addBotMessageToUI(text: string): void {
    this.messages.push({
      id: uuid.v4(),
      text: text,
      sender: 'Gemini Ultra',
      avatar: "/assets/gemini.svg",
    });
  }


  private async sendTextToChatService(text: string): Promise<void> {
    this.loading = true;
    try {
      const trimmedText: string = this.trimStringToByteLimit(text);
      const result: GenerateContentResult = await this.chat.sendMessage(trimmedText);
      const response: EnhancedGenerateContentResponse = result.response;
      if (response) {
        this.addBotMessageToUI(response.text());
      }
    } catch (error: any) {
      this.addBotMessageToUI("ERROR: " + JSON.stringify(error?.message ?? error))
    } finally {
      this.loading = false;
    }
  }


  private scrollToBottom(): void {
    requestAnimationFrame((): void => {
      this.scroll.nativeElement.scrollTop = this.bottom.nativeElement.offsetTop;
    });
  }


  retry(text: string): void {
    if (this.isUserMessage(text)) {
      this.processAndSendUserMessage(text);
    }
  }

  isUserMessage(text: string) {
    //find original message
    const message: ChatMessage | undefined = this.messages.find((message: any) => message.text === text);
    return (message && message.sender);
  }

  showReply(text: string) {
    // only if it is a user prompt (it has a sender)
    return this.messages.find((message: any) => message.text === text && message.sender);
  }

  trackByFn(i: number, element: any) {
    return element.id;
  }

  delete(id: string) {
    this.messages = this.messages.filter((message: any) => message.id !== id);
  }


  private trimStringToByteLimit(text: string, maxSize: number = this.MAX_INPUT_SIZE_BYTES): string {
    if (maxSize < 1) throw new Error("Invalid maxSize");

    const marker = "...";
    const markerSize: number = this.encoder.encode(marker).length;
    maxSize = Math.min(maxSize, this.MAX_INPUT_SIZE_BYTES);

    if (text.length < maxSize / 2) {
      return text;
    }

    const inputBytes: Uint8Array = this.encoder.encode(text);
    if (inputBytes.length <= maxSize) {
      return text;
    }

    const trimmedBytes: Uint8Array = inputBytes.slice(0, maxSize - markerSize);
    console.log("Warning. Message was trimmed to fit max capacity: ", maxSize);

    return this.decoder.decode(trimmedBytes) + marker;
  }


}

window.document.addEventListener('copy', function (event: ClipboardEvent): void {
  const selection: Selection | null = window.getSelection();
  if (selection?.isCollapsed) {
    return;  // default action OK
  }
  const fragment: DocumentFragment | undefined = selection?.getRangeAt(0).cloneContents();
  const katexs: any = fragment?.querySelectorAll('.katex');
  if (katexs?.length === 0) {
    return;  // default action OK
  }
  katexs?.forEach(function (element: { querySelector: (arg0: string) => any; replaceWith: (arg0: any) => void; }) {
    const texSource = element.querySelector('annotation');
    if (texSource) {
      element.replaceWith(texSource);
      texSource.innerHTML = '$' + texSource.innerHTML + '$';
    }
  });
  fragment?.querySelectorAll('.katex-display annotation').forEach(function (element) {
    element.innerHTML = '$' + element.innerHTML + '$';
  })
  event?.clipboardData?.setData('text/plain', fragment?.textContent || "");
  event?.clipboardData?.setData('text/html', selection?.getRangeAt(0).cloneContents().textContent || "");
  event.preventDefault();
})
