import React, { useState, useEffect, useCallback } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Paper,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  InputAdornment,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import customTheme from './customTheme';
import Layout from './components/Layout/Layout';

const API_BASE_URL = 'http://localhost:8000';

const api = {
  getOverview: async (expenseId = null) => {
    const url = expenseId 
      ? `${API_BASE_URL}/expenses?expensesId=${expenseId}`
      : `${API_BASE_URL}/expenses`;
    const response = await fetch(url);
    return response.json();
  },
  
  getSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/expenses/sum`);
    return response.json();
  },
  
  createExpense: async (expenseData) => {
    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) {
      throw new Error('Failed to create expense');
    }
    return response.json();
  },
  
  getTypes: async () => {
    const response = await fetch(`${API_BASE_URL}/expenses/limit`);
    return response.json();
  },
  
  createType: async (typeData) => {
    const response = await fetch(`${API_BASE_URL}/expensetype`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(typeData),
    });
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('A típus név már létezik');
      }
      throw new Error('Failed to create type');
    }
    return response.json();
  },
  
  updateExpense: async (expenseId, expenseData) => {
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
    if (!response.ok) {
      throw new Error('Failed to update expense');
    }
    return response.json();
  },

  updateExpenseType: async (typeId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/expensetype/${typeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('A típus név már létezik');
      }
      throw new Error('Failed to update expense type');
    }
    return response.json();
  },
};

// Enhanced Table Component with filtering and sorting
const EnhancedTable = ({ rows = [], columns, onSort, onFilter, title }) => {
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    const newOrder = isAsc ? 'desc' : 'asc';
    setOrder(newOrder);
    setOrderBy(property);
    onSort && onSort(property, newOrder);
  };

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value };
    setFilters(newFilters);
    onFilter && onFilter(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilter && onFilter({});
  };

  // Biztosítsuk, hogy rows tömb legyen
  const safeRows = Array.isArray(rows) ? rows : [];
  
  const filteredRows = safeRows.filter(row => {
    return Object.keys(filters).every(key => {
      if (!filters[key]) return true;
      const cellValue = row[key]?.toString().toLowerCase() || '';
      return cellValue.includes(filters[key].toLowerCase());
    });
  });

  const sortedRows = filteredRows.sort((a, b) => {
    if (!orderBy) return 0;
    
    let aValue = a[orderBy];
    let bValue = b[orderBy];
    
    // Handle numbers
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle strings and dates
    aValue = aValue?.toString().toLowerCase() || '';
    bValue = bValue?.toString().toLowerCase() || '';
    
    if (order === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper elevation={3}>
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{title}</Typography>
          <Box>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterIcon />
            </IconButton>
            {Object.keys(filters).length > 0 && (
              <IconButton onClick={clearFilters}>
                <ClearIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {showFilters && (
          <Box mb={2}>
            <Grid container spacing={2}>
              {columns.map(column => (
                <Grid item xs={12} sm={6} md={3} key={column.id}>
                  <TextField
                    size="small"
                    label={`Filter ${column.label}`}
                    value={filters[column.id] || ''}
                    onChange={(e) => handleFilterChange(column.id, e.target.value)}
                    InputProps={{
                      endAdornment: filters[column.id] && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => handleFilterChange(column.id, '')}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map(column => (
                  <TableCell key={column.id}>
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, index) => (
                <TableRow key={index} hover>
                  {columns.map(column => (
                    <TableCell key={column.id}>
                      {column.format ? column.format(row[column.id]) : row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Box>
    </Paper>
  );
};

const Homepage = ({ onNavigate }) => {
  const [overview, setOverview] = useState([]);
  const [summary, setSummary] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const loadData = useCallback(async () => {
    try {
      const [overviewData, summaryData, typesData] = await Promise.all([
        api.getOverview(),
        api.getSummary(),
        api.getTypes()
      ]);
      
      // Biztosítsuk, hogy overviewData és summaryData tömbök legyenek
      setOverview(Array.isArray(overviewData) ? overviewData : []);
      setSummary(Array.isArray(summaryData) ? summaryData : []);
      setTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      console.error('Error loading data:', error);
      // Hiba esetén üres tömbök
      setOverview([]);
      setSummary([]);
      setTypes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Editing functions
  const handleEdit = (expense) => {
    setEditingId(expense.expensesId);
    const selectedType = types.find(type => type.typeName === expense.typeName);
    setEditData({
      date: expense.date,
      typeId: selectedType ? selectedType.typeId : '',
      cost: expense.cost,
      description: expense.description || ''
    });
  };

  const handleSave = async (expenseId) => {
    try {
      // Validate data before sending
      if (!editData.date || !editData.typeId || !editData.cost) {
        setSnackbar({
          open: true,
          message: 'Minden kötelező mezőt ki kell tölteni!',
          severity: 'error'
        });
        return;
      }

      const costValue = parseInt(editData.cost);
      if (isNaN(costValue) || costValue <= 0) {
        setSnackbar({
          open: true,
          message: 'Az összeg pozitív egész szám kell legyen!',
          severity: 'error'
        });
        return;
      }

      // Prepare data with proper types
      const dataToSend = {
        date: editData.date,
        typeId: parseInt(editData.typeId),
        cost: costValue,
        description: editData.description || ''
      };
      
      const updatedExpense = await api.updateExpense(expenseId, dataToSend);
      
      // Update the overview data locally instead of reloading everything
      setOverview(prevOverview => 
        prevOverview.map(expense => 
          expense.expensesId === expenseId 
            ? {
                ...expense,
                date: updatedExpense.date,
                typeName: updatedExpense.typeName,
                cost: updatedExpense.cost,
                description: updatedExpense.description
              }
            : expense
        )
      );
      
      setEditingId(null);
      setEditData({});
      setSnackbar({
        open: true,
        message: 'Költés sikeresen módosítva!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating expense:', error);
      setSnackbar({
        open: true,
        message: 'Hiba történt a módosítás során!',
        severity: 'error'
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };


  const summaryColumns = [
    { id: 'month', label: 'Hónap' },
    { id: 'typeName', label: 'Típus' },
    { id: 'sumCost', label: 'Havi költés', format: (value) => Math.floor(value).toLocaleString('hu-HU') + ' Ft' },
    { id: 'limitMonth', label: 'Havi limit', format: (value) => value ? Math.floor(value).toLocaleString('hu-HU') + ' Ft' : '-' },
  ];

  // Biztosítsuk, hogy summary tömb legyen
  const summaryRowsWithStyle = Array.isArray(summary) ? summary.map(item => ({
    ...item,
    isOverLimit: item.limitMonth && item.sumCost > item.limitMonth
  })) : [];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Betöltés...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Áttekintés
      </Typography>
      
      <Box mb={3}>
        <Paper elevation={3}>
          <Box p={2}>
            <Typography variant="h6" mb={2}>Költések</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Dátum</strong></TableCell>
                    <TableCell><strong>Típus</strong></TableCell>
                    <TableCell><strong>Összeg</strong></TableCell>
                    <TableCell><strong>Leírás</strong></TableCell>
                    <TableCell><strong>Műveletek</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overview
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((expense) => (
                    <TableRow key={expense.expensesId} hover>
                      <TableCell>
                        {editingId === expense.expensesId ? (
                          <TextField
                            size="small"
                            type="date"
                            value={editData.date || ''}
                            onChange={(e) => handleEditChange('date', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        ) : (
                          format(new Date(expense.date), 'yyyy-MM-dd')
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === expense.expensesId ? (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={editData.typeId || ''}
                              onChange={(e) => handleEditChange('typeId', e.target.value)}
                            >
                              {types.map(type => (
                                <MenuItem key={type.typeId} value={type.typeId}>
                                  {type.typeName}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          expense.typeName
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === expense.expensesId ? (
                          <TextField
                            size="small"
                            type="number"
                            value={editData.cost || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
                                handleEditChange('cost', value);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                                e.preventDefault();
                              }
                            }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">Ft</InputAdornment>
                            }}
                            inputProps={{ min: 1 }}
                          />
                        ) : (
                          Math.floor(expense.cost).toLocaleString('hu-HU') + ' Ft'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === expense.expensesId ? (
                          <TextField
                            size="small"
                            value={editData.description || ''}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            inputProps={{ maxLength: 50 }}
                          />
                        ) : (
                          expense.description || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === expense.expensesId ? (
                          <Box display="flex" gap={1}>
                            <IconButton
                              color="primary"
                              onClick={() => handleSave(expense.expensesId)}
                              size="small"
                            >
                              <SaveIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={handleCancel}
                              size="small"
                            >
                              <CancelIcon />
                            </IconButton>
                          </Box>
                        ) : (
                          <IconButton
                            color="primary"
                            onClick={() => handleEdit(expense)}
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={overview.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </Box>
        </Paper>
        
        <Box mt={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => onNavigate('new-expense')}
          >
            Új kiadás felvétele
          </Button>
        </Box>
      </Box>

      {!showSummary && (
        <Button
          variant="outlined"
          onClick={() => setShowSummary(true)}
          sx={{ mb: 2 }}
        >
          Összesítő táblázat megjelenítése
        </Button>
      )}

      {showSummary && (
        <Box>
          <EnhancedTable
            rows={summaryRowsWithStyle}
            columns={summaryColumns}
            title="Összesítés"
          />
          
          <Box mt={2}>
            <Button
              variant="contained"
              onClick={() => onNavigate('limits')}
            >
              Limitek módosítása
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const NewExpense = ({ onNavigate }) => {
  const [types, setTypes] = useState([]);
  const [expenses, setExpenses] = useState([{
    date: new Date().toISOString().split('T')[0],
    typeId: '',
    cost: '',
    description: ''
  }]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const typesData = await api.getTypes();
      setTypes(typesData);
      if (typesData.length > 0) {
        setExpenses(prev => prev.map(exp => ({ ...exp, typeId: typesData[0].typeId })));
      }
    } catch (error) {
      console.error('Error loading types:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpenseRow = () => {
    setExpenses([...expenses, {
      date: new Date().toISOString().split('T')[0],
      typeId: types[0]?.typeId || '',
      cost: '',
      description: ''
    }]);
  };

  const removeExpenseRow = (index) => {
    if (expenses.length > 1) {
      setExpenses(expenses.filter((_, i) => i !== index));
    }
  };

  const updateExpense = (index, field, value) => {
    const updatedExpenses = [...expenses];
    updatedExpenses[index][field] = value;
    setExpenses(updatedExpenses);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    for (let expense of expenses) {
      if (!expense.date || !expense.typeId || !expense.cost) {
        setSnackbar({
          open: true,
          message: 'Minden kötelező mezőt ki kell tölteni!',
          severity: 'error'
        });
        return;
      }
      if (new Date(expense.date) > new Date()) {
        setSnackbar({
          open: true,
          message: 'A dátum nem lehet jövőbeli!',
          severity: 'error'
        });
        return;
      }
      if (parseInt(expense.cost) <= 0) {
        setSnackbar({
          open: true,
          message: 'Az összeg pozitív egész szám kell legyen!',
          severity: 'error'
        });
        return;
      }
      if (expense.description && expense.description.length > 50) {
        setSnackbar({
          open: true,
          message: 'A leírás maximum 50 karakter lehet!',
          severity: 'error'
        });
        return;
      }
    }

    try {
      for (let expense of expenses) {
        if (expense.date && expense.typeId && expense.cost) {
          await api.createExpense({
            date: expense.date,
            typeId: parseInt(expense.typeId),
            cost: parseInt(expense.cost),
            description: expense.description
          });
        }
      }
      setSnackbar({
        open: true,
        message: 'Költések sikeresen rögzítve!',
        severity: 'success'
      });
      setTimeout(() => onNavigate('home'), 1500);
    } catch (error) {
      console.error('Error creating expenses:', error);
      setSnackbar({
        open: true,
        message: 'Hiba történt a mentés során!',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Betöltés...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Új költés rögzítése
      </Typography>
      
      <form onSubmit={handleSubmit}>
        {expenses.map((expense, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                Tétel {index + 1}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Dátum"
                    type="date"
                    value={expense.date}
                    onChange={(e) => updateExpense(index, 'date', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Típus</InputLabel>
                    <Select
                      value={expense.typeId}
                      label="Típus"
                      onChange={(e) => updateExpense(index, 'typeId', e.target.value)}
                    >
                      {types.map(type => (
                        <MenuItem key={type.typeId} value={type.typeId}>
                          {type.typeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Összeg"
                    type="number"
                    value={expense.cost}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
                        updateExpense(index, 'cost', value);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                        e.preventDefault();
                      }
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">Ft</InputAdornment>
                    }}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Leírás"
                    value={expense.description}
                    onChange={(e) => updateExpense(index, 'description', e.target.value)}
                    inputProps={{ maxLength: 50 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
            
            {expenses.length > 1 && (
              <CardActions>
                <Button
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={() => removeExpenseRow(index)}
                >
                  Tétel törlése
                </Button>
              </CardActions>
            )}
          </Card>
        ))}
        
        <Box mb={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addExpenseRow}
          >
            További tétel felvétele
          </Button>
        </Box>
        
        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Mentés
          </Button>
        </Box>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Új típus felvétele komponens
const NewTypeForm = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    typeName: '',
    limitMonth: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.typeName.trim()) {
      setSnackbar({
        open: true,
        message: 'A típus megnevezése kötelező!',
        severity: 'error'
      });
      return;
    }
    
    if (formData.typeName.length > 50) {
      setSnackbar({
        open: true,
        message: 'A típus megnevezése maximum 50 karakter lehet!',
        severity: 'error'
      });
      return;
    }
    
    if (formData.limitMonth && parseInt(formData.limitMonth) < 0) {
      setSnackbar({
        open: true,
        message: 'A limit nem lehet negatív!',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const typeData = {
        typeName: formData.typeName.trim(),
        limitMonth: formData.limitMonth ? parseInt(formData.limitMonth) : null
      };
      
      await api.createType(typeData);
      setSnackbar({
        open: true,
        message: 'Új típus sikeresen létrehozva!',
        severity: 'success'
      });
      setTimeout(() => onNavigate('limits'), 1500);
    } catch (error) {
      console.error('Error creating type:', error);
      setSnackbar({
        open: true,
        message: 'Hiba történt a mentés során!',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Új típus felvétele
      </Typography>
      
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Új típus megnevezése"
                  value={formData.typeName}
                  onChange={(e) => handleChange('typeName', e.target.value)}
                  inputProps={{ maxLength: 50 }}
                  required
                  helperText={`${formData.typeName.length}/50 karakter`}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Havi limit"
                  type="number"
                  value={formData.limitMonth}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
                      handleChange('limitMonth', value);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                      e.preventDefault();
                    }
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">Ft</InputAdornment>
                  }}
                  inputProps={{ min: 0 }}
                  helperText="Opcionális"
                />
              </Grid>
            </Grid>
            
            <Box mt={3} display="flex" gap={2} justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Mentés...' : 'Mentés'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

// Limitek kezelése komponens
const LimitsManagement = ({ onNavigate }) => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ typeName: '', limitMonth: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      const typesData = await api.getTypes();
      setTypes(typesData);
    } catch (error) {
      console.error('Error loading types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type) => {
    setEditingId(type.typeId);
    setEditData({
      typeName: type.typeName || '',
      limitMonth: type.limitMonth || ''
    });
  };

  const handleSave = async (typeId) => {
    try {
      // Validation
      if (!editData.typeName.trim()) {
        setSnackbar({
          open: true,
          message: 'A típus neve kötelező!',
          severity: 'error'
        });
        return;
      }

      if (editData.typeName.length > 50) {
        setSnackbar({
          open: true,
          message: 'A típus neve maximum 50 karakter lehet!',
          severity: 'error'
        });
        return;
      }

      const limitValue = parseInt(editData.limitMonth);
      if (editData.limitMonth !== '' && (isNaN(limitValue) || limitValue < 0)) {
        setSnackbar({
          open: true,
          message: 'A limit nem lehet negatív!',
          severity: 'error'
        });
        return;
      }
      
      // Prepare update data
      const updateData = {
        typeName: editData.typeName.trim(),
      };
      
      if (editData.limitMonth !== '') {
        updateData.limitMonth = limitValue;
      } else {
        updateData.limitMonth = null;
      }
      
      await api.updateExpenseType(typeId, updateData);
      await loadTypes();
      setEditingId(null);
      setEditData({ typeName: '', limitMonth: '' });
      setSnackbar({
        open: true,
        message: 'Típus sikeresen frissítve!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating type:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Hiba történt a mentés során!',
        severity: 'error'
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({ typeName: '', limitMonth: '' });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography>Betöltés...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Típusok kezelése
      </Typography>
      
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Típus</strong></TableCell>
              <TableCell><strong>Limit</strong></TableCell>
              <TableCell><strong>Műveletek</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map(type => (
              <TableRow key={type.typeId} hover>
                <TableCell>
                  {editingId === type.typeId ? (
                    <TextField
                      size="small"
                      value={editData.typeName}
                      onChange={(e) => {
                        setEditData(prev => ({ ...prev, typeName: e.target.value }));
                      }}
                      inputProps={{ maxLength: 50 }}
                      helperText={`${editData.typeName.length}/50 karakter`}
                    />
                  ) : (
                    type.typeName
                  )}
                </TableCell>
                <TableCell>
                  {editingId === type.typeId ? (
                    <TextField
                      size="small"
                      type="number"
                      value={editData.limitMonth}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
                          setEditData(prev => ({ ...prev, limitMonth: value }));
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-' || e.key === '.') {
                          e.preventDefault();
                        }
                      }}
                      inputProps={{ min: 0 }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Ft</InputAdornment>
                      }}
                      placeholder="Opcionális"
                    />
                  ) : (
                    type.limitMonth ? Math.floor(type.limitMonth).toLocaleString('hu-HU') + ' Ft' : '-'
                  )}
                </TableCell>
                <TableCell>
                  {editingId === type.typeId ? (
                    <Box display="flex" gap={1}>
                      <IconButton
                        color="primary"
                        onClick={() => handleSave(type.typeId)}
                        size="small"
                      >
                        <SaveIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={handleCancel}
                        size="small"
                      >
                        <CancelIcon />
                      </IconButton>
                    </Box>
                  ) : (
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(type)}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box mt={2}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => onNavigate('new-type')}
        >
          Új típus felvétele
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <Homepage onNavigate={navigate} />;
      case 'new-expense':
        return <NewExpense onNavigate={navigate} />;
      case 'limits':
        return <LimitsManagement onNavigate={navigate} />;
      case 'new-type':
        return <NewTypeForm onNavigate={navigate} />;
      default:
        return <Homepage onNavigate={navigate} />;
    }
  };

  return (
    <ThemeProvider theme={customTheme}>
      <CssBaseline />
      <Layout currentPage={currentPage} onNavigate={navigate}>
        {renderCurrentPage()}
      </Layout>
    </ThemeProvider>
  );
};

export default App;