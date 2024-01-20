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
import {ChatMessage} from "../types/message-chat.type";
import {FormControl, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatInputModule} from "@angular/material/input";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {NgForOf, NgIf, NgStyle} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";
import {ProcessCodeBlocksPipe} from "../pipes/process-code-block.pipe";
import {MermaidService} from "../mermaid/mermaid.service";


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
  loading: boolean = false;
  katexOptions: KatexOptions = {
    displayMode: true,
    throwOnError: false
  };

  navigator: any = window.navigator;
  MAX_SIZE_BYTES: number = 30720 - 3072; //request payload approximation 2229 TODO: expose these from the client
  geminiModel!: GenerativeModel;
  chat!: ChatSession;
  private encoder = new TextEncoder();
  private decoder = new TextDecoder();


  constructor(public mermaidService: MermaidService) {
  }


  ngOnInit(): void {
    this.geminiInit();
    this.chatCreating();
    this.addMessage(this.mermaidService.diagrams);
  }

  ngAfterViewChecked(): void {
    document.querySelectorAll("[class^=node-icon-]").forEach((elem: Element) => {
      elem.className = elem.className.replace(/\s/g, ' ');
    })
  }


  chatCreating(): void {
    const generationConfig: GenerationConfig = {
      temperature: 0.5,
      topP: 1,
      topK: 1,
      maxOutputTokens: 2048,
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
        parts: "Keep your answers brief and to a single paragraph. Use markdown formatting extensively, Katex for formulas and MermaidJS for diagrams. Do not use other formats. Always specify the language in code fences. Eg: ```HTML. Try to use at least one or more of these special formatting options when providing your answers. Pay special attention to indentation when using MermaidJS and be very conservative using features to avoid syntax errors. Reply understood if you got everything.",
      },
      {
        role: "model",
        parts: "Understood.",
      },
      {
        role: "user",
        parts: "Difference between Constructor and ngOnInit? Answer: The constructor is called when an **Angular component** is created, while `ngOnInit` is called after the component's data has been initialized. This means that the constructor can be used to initialize the component's properties, while `ngOnInit` can be used to perform any additional initialization that needs to be done after the component's data has been loaded.\n\nFor example, the constructor might be used to set the initial value of a component's property, while `ngOnInit` might be used to subscribe to an observable or call a service.\n\nHere is an example of a constructor:\n\n```ts\nconstructor(private service: MyService) {}\n```\nAnd here is an example of `ngOnInit`:\n\n```ts\nngOnInit() {\n  this.service.getData().subscribe(data => {\n    this.data = data;\n  });\n}\n```\nIn this example, the constructor is used to inject the `MyService` dependency, while `ngOnInit` is used to subscribe to the `getData` observable and update the component's data property with the data that is returned.",
      },
      {
        role: "model",
        parts: "The constructor is called when an **Angular component** is created, while `ngOnInit` is called after the component's data has been initialized. This means that the constructor can be used to initialize the component's properties, while `ngOnInit` can be used to perform any additional initialization that needs to be done after the component's data has been loaded.\n\nFor example, the constructor might be used to set the initial value of a component's property, while `ngOnInit` might be used to subscribe to an observable or call a service.\n\nHere is an example of a constructor:\n\n```ts\nconstructor(private service: MyService) {}\n```\nAnd here is an example of `ngOnInit`:\n\n```ts\nngOnInit() {\n  this.service.getData().subscribe(data => {\n    this.data = data;\n  });\n}\n```\nIn this example, the constructor is used to inject the `MyService` dependency, while `ngOnInit` is used to subscribe to the `getData` observable and update the component's data property with the data that is returned.",
      },
      {
        role: "user",
        parts: "Summarise Google's Generative AI using a mind map with MermaidJS.",
      },
      {
        role: "model",
        parts: `
          \`\`\`mermaid
          mindmap
          {{Google Generative AI}}
            VertexAI
            ::icon(fa fa-cloud)
             (Text)
             ::icon(fa fa-file-alt)
             (Code)
             ::icon(fa fa-code)
             (Audio)
             ::icon(fa fa-volume-up)
             (Images)
             ::icon(fa fa-image)
            MakerSuite
            ::icon(fa fa-edit)
             [Gemini for Text]
             ::icon(fa fa-file-alt)
             [Gemini for Chat]
             ::icon(fa fa-comments)
             [Embeddings]
             ::icon(fa fa-tasks)
          \`\`\``,
      }
    ]
  }

  handleUserMessage(event: Event): void {
    const value: string = this.input.value ?? '';

    if (!value.trim()) {
      event.preventDefault();
      return;
    }

    this.sendMessage(value);
    this.input.setValue('');
  }


  public async sendMessage(text: string): Promise<void> {
    const processedText: string = this.processText(text);
    this.addMessage(processedText);
    await this.sendMessageAndHandleResponse(text);
  }

  private processText(text: string): string {
    return text.split(/(```[^`]+```)/)
      .map((section: string, index: number) => index % 2 === 0 ? section.replace(/\n/g, "<br>") : section)
      .join('');
  }

  private addMessage(processedText: string): void {
    this.messages.push({
      id: uuid.v4(),
      text: processedText,
      sender: '@fed4wet',
      avatar: "https://media.licdn.com/dms/image/D4D03AQG5DE3yJNcNPA/profile-displayphoto-shrink_800_800/0/1676575729872?e=1710374400&v=beta&t=rnJdhNttPWGa29hGpO3bWtCUCF_GUcONYg3IJ3chmyc",
    });
    this.scrollToBottom();
  }

  private addBotMessage(text: string): void {
    this.messages.push({
      id: uuid.v4(),
      text: text,
      sender: 'Gemini Ultra',
      avatar: "/assets/gemini.svg",
    });
  }


  private async sendMessageAndHandleResponse(text: string): Promise<void> {
    this.loading = true;
    try {
      const result: GenerateContentResult = await this.chat.sendMessage(this.trimStringToByteLimit(text));
      const response: EnhancedGenerateContentResponse = result.response;
      if (response) {
        this.addBotMessage(response.text());
      }
    } catch (error) {
      window.alert(error)
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
      this.sendMessage(text);
    }
  }

  isUserMessage(text: string) {
    //find original message
    const message: ChatMessage | undefined = this.messages.find((message: any) => message.text === text);
    return (message && message.sender /* user message */);
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



  private trimStringToByteLimit(text: string, maxSize: number = this.MAX_SIZE_BYTES): string {
    if (maxSize < 1) throw new Error("Invalid maxSize");

    const marker = "...";
    const markerSize: number = this.encoder.encode(marker).length;
    maxSize = Math.min(maxSize, this.MAX_SIZE_BYTES);

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
