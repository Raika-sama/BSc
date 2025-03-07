import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    List,
    ListItem,
    ListItemText,
    Stack,
    Chip,
    Box,
    Divider,
    Button,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    AccessTime as AccessTimeIcon,
    Add as AddIcon,
    PlayArrow as ActivateIcon,
    ViewList as ViewListIcon, // Sostituito ClassesIcon con ViewListIcon
    Edit as EditIcon
} from '@mui/icons-material';

const PlannedYearsCard = ({ 
    plannedYears, 
    formatYearDisplay, 
    formatDate, 
    handleOpenNewYearDialog,
    handleOpenEditYearDialog,
    handleOpenClassesDialog,
    handleActivateYear
}) => {
    return (
        <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <AccessTimeIcon color="info" />
                    <Typography variant="h6">Anni Accademici Pianificati</Typography>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={handleOpenNewYearDialog}
                    >
                        Aggiungi
                    </Button>
                </Stack>

                {plannedYears.length > 0 ? (
                    <List>
                        {plannedYears.map((year, index) => (
                            <React.Fragment key={year._id || index}>
                                <ListItem
                                    secondaryAction={
                                        <Box>
                                            <Tooltip title="Modifica Anno">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleOpenEditYearDialog(year)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Visualizza Classi">
                                                <IconButton 
                                                    edge="end" 
                                                    onClick={() => handleOpenClassesDialog(year)}
                                                >
                                                    <ViewListIcon /> {/* Sostituito ClassesIcon con ViewListIcon */}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Attiva Anno">
                                                <IconButton 
                                                    edge="end" 
                                                    color="success"
                                                    onClick={() => handleActivateYear(year._id)}
                                                >
                                                    <ActivateIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center">
                                                <Typography variant="subtitle1" component="span">
                                                    {formatYearDisplay(year.year)}
                                                </Typography>
                                                <Chip
                                                    label="Pianificato"
                                                    size="small"
                                                    color="info"
                                                    sx={{ ml: 1 }}
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            <Typography variant="body2" component="span" color="text.secondary">
                                                Inizio: {formatDate(year.startDate)} • Fine: {formatDate(year.endDate)}
                                            </Typography>
                                        }
                                        disableTypography
                                    />
                                </ListItem>
                                {index < plannedYears.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            Nessun anno accademico pianificato
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PlannedYearsCard;