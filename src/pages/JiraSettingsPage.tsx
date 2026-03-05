import React from 'react';
import Layout from '../components/Layout';
import JiraConfigModal from '../components/JiraConfigModal';

const JiraSettingsPage: React.FC = () => {
  return (
    <Layout>
      <JiraConfigModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    </Layout>
  );
};

export default JiraSettingsPage;