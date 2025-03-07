import React, { useState } from 'react';
import {
  Box,
  Button,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Typography
} from '@mui/material';
import { FolderPlus, X } from 'lucide-react';
import { usePrompts } from '../contexts/PromptContext';

interface FolderSelectorProps {
  selectedFolder?: string;
  onChange: (folderId: string | undefined) => void;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({
                                                         selectedFolder,
                                                         onChange,
                                                       }) => {
  const { folders, createFolder } = usePrompts();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleFolderSelect = (folderId: string | undefined) => {
    onChange(folderId);
    setIsDropdownOpen(false);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleClose = () => {
    setIsDropdownOpen(false);
  };

  const selectedFolderName = selectedFolder
      ? folders.find((f) => f.id === selectedFolder)?.name
      : 'Select folder';

  return (
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Button
            variant="outlined"
            onClick={handleButtonClick}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              textAlign: 'left',
              py: 1,
              px: 1.5,
              color: 'text.primary',
              bgcolor: 'background.paper'
            }}
        >
          <Typography
              variant="body2"
              noWrap
              sx={{
                flexGrow: 1,
                textAlign: 'left',
                color: selectedFolder ? 'text.primary' : 'text.secondary'
              }}
          >
            {selectedFolderName}
          </Typography>
        </Button>

        <Popper
            open={isDropdownOpen}
            anchorEl={anchorEl}
            placement="bottom-start"
            style={{ width: anchorEl?.offsetWidth, zIndex: 1300 }}
        >
          <ClickAwayListener onClickAway={handleClose}>
            <Paper
                elevation={3}
                sx={{
                  mt: 0.5,
                  maxHeight: 250,
                  overflow: 'auto'
                }}
            >
              <List sx={{ p: 0 }}>
                <ListItemButton
                    onClick={() => handleFolderSelect(undefined)}
                    selected={!selectedFolder}
                >
                  <ListItemText
                      primary="No folder"
                      primaryTypographyProps={{
                        color: 'text.secondary',
                        variant: 'body2'
                      }}
                  />
                </ListItemButton>

                {folders.map((folder) => (
                    <ListItemButton
                        key={folder.id}
                        onClick={() => handleFolderSelect(folder.id)}
                        selected={selectedFolder === folder.id}
                        sx={{
                          '&.Mui-selected': {
                            backgroundColor: 'rgba(59, 130, 246, 0.08)',
                          }
                        }}
                    >
                      <ListItemText
                          primary={folder.name}
                          primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItemButton>
                ))}

                {isCreatingFolder ? (
                    <ListItem sx={{ py: 1, px: 2 }}>
                      <TextField
                          fullWidth
                          size="small"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Folder name"
                          autoFocus
                          InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={handleCreateFolder}
                                      color="primary"
                                  >
                                    <FolderPlus size={16} />
                                  </IconButton>
                                  <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() => setIsCreatingFolder(false)}
                                      sx={{ ml: 0.5 }}
                                  >
                                    <X size={16} />
                                  </IconButton>
                                </InputAdornment>
                            ),
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFolder();
                          }}
                      />
                    </ListItem>
                ) : (
                    <ListItemButton
                        onClick={() => setIsCreatingFolder(true)}
                        sx={{ color: 'primary.main' }}
                    >
                      <FolderPlus size={16} style={{ marginRight: 8 }} />
                      <ListItemText
                          primary="Create new folder"
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: 'primary'
                          }}
                      />
                    </ListItemButton>
                )}
              </List>
            </Paper>
          </ClickAwayListener>
        </Popper>
      </Box>
  );
};

export default FolderSelector;
