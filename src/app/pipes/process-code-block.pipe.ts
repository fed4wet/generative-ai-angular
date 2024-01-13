import {Pipe, PipeTransform} from '@angular/core';
import highlight from 'highlight.js';

@Pipe({
  standalone: true,
  name: 'processCodeBlocks'
})
export class ProcessCodeBlocksPipe implements PipeTransform {

  transform(code: string): string {
    const processedMarkdown: string = code.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code): string => {

      const displayLanguage = highlight.highlightAuto(code).language
      switch (displayLanguage) {
        case 'mermaid':
          return `<div class="mermaid">${this.formatWhitespace(code)}</div>`;
        case undefined:
          return highlight.highlight(code, {language: 'plaintext'}).value;
        default:
          return `<div class="code-header">${displayLanguage}</div>

\`\`\`${language}
${this.formatWhitespace(code)}
\`\`\``;
      }
    });

    return processedMarkdown;
  }


  private formatWhitespace(code: string): string {
    return code.replace(/ {1,}|\t+/g, (whitespace: any) => {
      return whitespace.replace(/\s/g, `\u{00A0}`);
    })
  }
}
