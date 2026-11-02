import React, { useEffect, useRef, useState } from 'react';
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
  const [initial, setInitial] = useState(null);
  const value = useRef('');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    invoke('getSettings').then((result) => {
      if (result.ok) {
        value.current = String(result.data.maxLength);
        setInitial(value.current);
      } else setNotice({ appearance: 'error', text: result.message });
    });
  }, []);

  const save = async () => {
    const result = await invoke('saveSettings', { maxLength: value.current });
    setNotice(
      result.ok
        ? { appearance: 'success', text: 'Settings saved.' }
        : { appearance: 'warning', text: result.message },
    );
  };

  if (initial === null && !notice) return <Spinner label="Loading settings" />;

  return (
    <Stack space="space.200">
      <Heading size="medium">Decision notes settings</Heading>
      <Text>Choose the maximum number of characters for each decision and reason.</Text>
      {notice && <SectionMessage appearance={notice.appearance}><Text>{notice.text}</Text></SectionMessage>}
      <Textfield
        aria-label="Maximum characters"
        key={initial}
        defaultValue={initial ?? ''}
        onChange={(event) => {
          value.current = event.target.value;
        }}
      />
      <Button appearance="primary" onClick={save}>Save</Button>
    </Stack>
  );
};

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);
