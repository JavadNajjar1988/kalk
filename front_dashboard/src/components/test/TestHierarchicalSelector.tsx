import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import HierarchicalSelector from '@/components/common/HierarchicalSelector';

const TestHierarchicalSelector: React.FC = () => {
  const [usersPath, setUsersPath] = useState<string[]>([]);
  const [usersFields, setUsersFields] = useState<any[]>([]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Test Hierarchical Selector
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Users Hierarchical Selector (pr-2-3)
        </Typography>
        <HierarchicalSelector
          categoryType="users"
          value={usersPath}
          onChange={(path, finalNodeId) => {
            console.log('Users path changed:', path, finalNodeId);
            setUsersPath(path);
          }}
          onFieldsChange={(fields) => {
            console.log('Users fields changed:', fields);
            setUsersFields(fields);
          }}
        />
        
        <Typography variant="body2" sx={{ mt: 2 }}>
          Current path: {JSON.stringify(usersPath)}
        </Typography>
        <Typography variant="body2">
          Fields count: {usersFields.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default TestHierarchicalSelector;