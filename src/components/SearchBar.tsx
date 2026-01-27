
import React, { useEffect, useState } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface Props {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const SearchBar: React.FC<Props> = ({ value = '', onChange, placeholder = 'Search...', debounceMs = 300 }) => {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    const t = window.setTimeout(() => onChange(local), debounceMs);
    return () => window.clearTimeout(t);
  }, [local, onChange, debounceMs]);

  return (
    <TextField
      fullWidth
      size="small"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      placeholder={placeholder}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  );
};

export default SearchBar;
