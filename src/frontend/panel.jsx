import React, { useEffect, useState } from 'react';
import ForgeReconciler, {
  Button,
  Heading,
  Inline,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTransition,
  SectionMessage,
  Spinner,
  Stack,
  Text,
  TextArea,
  Textfield,
} from '@forge/react';
import { invoke } from '@forge/bridge';

const blank = { decision: '', reason: '' };

const App = () => {
  const [state, setState] = useState(null);
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    invoke('load').then((result) => {
      if (result.ok) setState(result.data);
      else setMessage(result.message);
    });
  }, []);

  const run = async (name, payload, after) => {
    setSaving(true);
    setMessage('');
    const result = await invoke(name, payload);
    setSaving(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setState((current) => ({ ...current, decisions: result.data }));
    after?.();
  };

  const save = () => {
    const clear = () => {
      setForm(blank);
      setEditingId(null);
    };
    if (editingId) run('update', { ...form, id: editingId }, clear);
    else run('add', form, clear);
  };

  if (!state && !message) return <Spinner label="Loading decisions" />;
  if (!state) return <SectionMessage appearance="error"><Text>{message}</Text></SectionMessage>;

  return (
    <Stack space="space.200">
      <Text>{state.issue.key}: {state.issue.title}</Text>
      {message && <SectionMessage appearance="warning"><Text>{message}</Text></SectionMessage>}
      <Stack space="space.100">
        <Heading size="small">{editingId ? 'Edit decision' : 'Add a decision'}</Heading>
        <Textfield
          aria-label="Decision"
          placeholder="What did you decide?"
          value={form.decision}
          onChange={(event) => setForm({ ...form, decision: event.target.value })}
        />
        <TextArea
          aria-label="Reason"
          placeholder="Why did you decide this?"
          value={form.reason}
          onChange={(event) => setForm({ ...form, reason: event.target.value })}
        />
        <Inline space="space.100">
          <Button appearance="primary" isDisabled={saving} onClick={save}>
            {editingId ? 'Save changes' : 'Add decision'}
          </Button>
          {editingId && (
            <Button
              onClick={() => {
                setEditingId(null);
                setForm(blank);
              }}
            >
              Cancel
            </Button>
          )}
        </Inline>
      </Stack>
      {state.decisions.length === 0 && (
        <SectionMessage>
          <Text>No decisions yet. Add the first one above.</Text>
        </SectionMessage>
      )}
      {state.decisions.map((item) => (
        <Stack key={item.id} space="space.050">
          <Heading size="xsmall">{item.decision}</Heading>
          <Text>{item.reason}</Text>
          <Text>Updated {new Date(item.updatedAt).toLocaleDateString()}</Text>
          <Inline space="space.100">
            <Button
              appearance="subtle"
              onClick={() => {
                setEditingId(item.id);
                setForm({ decision: item.decision, reason: item.reason });
              }}
            >
              Edit
            </Button>
            <Button appearance="subtle" onClick={() => setDeletingId(item.id)}>Delete</Button>
          </Inline>
        </Stack>
      ))}
      <ModalTransition>
        {deletingId && (
          <Modal onClose={() => setDeletingId(null)}>
            <ModalHeader><ModalTitle>Delete this decision?</ModalTitle></ModalHeader>
            <ModalBody><Text>This can't be undone.</Text></ModalBody>
            <ModalFooter>
              <Button appearance="subtle" onClick={() => setDeletingId(null)}>Cancel</Button>
              <Button
                appearance="danger"
                onClick={() => {
                  const id = deletingId;
                  setDeletingId(null);
                  run('remove', { id });
                }}
              >
                Delete
              </Button>
            </ModalFooter>
          </Modal>
        )}
      </ModalTransition>
    </Stack>
  );
};

ForgeReconciler.render(<React.StrictMode><App /></React.StrictMode>);
