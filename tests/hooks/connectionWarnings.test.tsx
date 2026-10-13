import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ConnectionFields } from '../../src/components/pos/ConnectionFields';
import { saveConnection, stopCurrent } from '../../src/db/connectionStore';
import { translations } from '../../src/locales/i18n';
afterEach(()=>{cleanup();stopCurrent();localStorage.clear();});
it('P1-6 dört dilde online HTTP uyarısı ve obfuscation sınırı görünür',()=>{
  for (const language of ['tr','tm','en','ru'] as const) {
    saveConnection('QA',{local:'',online:'http://qa:fake@example.invalid/db',active:null});
    render(<ConnectionFields accountId="QA" storeDb="QA" language={language}/>);
    expect(screen.getByRole('alert').textContent).toBe(translations[language].conn.internetHttpWarning);
    expect(screen.getByText(translations[language].conn.storedOnDevice)).toBeTruthy();cleanup();
  }
});
