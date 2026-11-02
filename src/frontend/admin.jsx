import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Button,
  Heading,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  Textfield,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [value, setValue] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    invoke('getSettings').then((result) => {
      if (result.ok) setValue(String(result.data.maxLength));
      else setNotice({ appearance: 'error', text: result.message });
    });
  }, []);

  const save = async () => {
    const result = await invoke('saveSettings', { maxLength: value });
    setNotice(
      result.ok
        ? { appearance: 'success', text: 'Settings saved.' }
        : { appearance: 'warning', text: result.message },
    );
  };

  if (value === null && !notice) return <Spinner label="Loading settings" />;

  return (
    <Stack space="space.200">
      <Heading size="medium">Decision notes settings</Heading>
      <Text>Choose the maximum number of characters for each decision and reason.</Text>
      {notice && <SectionMessage appearance={notice.appearance}><Text>{notice.text}</Text></SectionMessage>}
      <Textfield
        aria-label="Maximum characters"
        value={value ?? ''}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button appearance="primary" onClick={save}>Save</Button>
    </Stack>
  );
};

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);
