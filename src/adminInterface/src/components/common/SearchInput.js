// src/components/common/SearchInput.js
import React from 'react';
import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchInput = ({ value, onChange, disabled, placeholder }) => {
    const handleChange = (event) => {
        onChange(event.target.value);
    };

    return (
        <TextField
            fullWidth
            variant="outlined"
            size="small"
            value={value}
            onChange={handleChange}
            disabled={disabled}
            placeholder={placeholder}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
            sx={{
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: 'divider',
                    },
                    '&:hover fieldset': {
                        borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: 'primary.main',
                    },
                },
            }}
        />
    );
};

export default SearchInput;