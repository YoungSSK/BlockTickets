import { createTheme } from '@mui/material/styles';
import { getPalette } from './palette';
import { getTypography } from './typography';
import { getComponentOverrides } from './components';

export const createAppTheme = (mode) =>
    createTheme({
        palette: getPalette(mode),
        typography: getTypography(),
        shape: {
            borderRadius: 8,
        },
        components: getComponentOverrides(mode),
    });
