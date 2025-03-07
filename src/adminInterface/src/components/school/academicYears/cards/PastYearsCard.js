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
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Archive as ArchiveIcon,
    ViewList as ViewListIcon, // Sostituito ClassesIcon con ViewListIcon
    Edit as EditIcon,
    Restore as RestoreIcon
} from '@mui/icons-material';

const PastYearsCard = ({ 
    pastYears, 
    formatYearDisplay, 
    formatDate, 
    handleOpenEditYearDialog,
    handleOpenClassesDialog,
    handleReactivateYear
}) => {
    return (
        <Card elevation={2}>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <ArchiveIcon color="primary" />
                    <Typography variant="h6">Storico Anni Accademici</Typography>
                </Stack>

                {pastYears.length > 0 ? (
                    <List>
                        {pastYears.map((year, index) => (
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
                                            <Tooltip title="Riattiva Anno">
                                                <IconButton 
                                                    edge="end" 
                                                    color="primary"
                                                    onClick={() => handleReactivateYear(year)}
                                                >
                                                    <RestoreIcon />
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
                                                    label="Archiviato"
                                                    size="small"
                                                    color="default"
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
                                {index < pastYears.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">
                            Nessuno storico disponibile
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default PastYearsCard;