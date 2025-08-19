# FINTRAK Setup Instructions

## Quick Setup Guide

### 1. Environment Setup

Create a `.env` file in the root directory with your database credentials:

```env
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=your-neon-host
PGPORT=5432
PGDATABASE=your-database-name
PGUSER=your-username
PGPASSWORD=your-password
```

### 2. Installation

```bash
# Install all dependencies
npm install

# Push database schema to your PostgreSQL instance
npm run db:push

# Start development server
npm run dev
```

### 3. Access Control

The application is currently configured for private access. To modify the authorized user:

Edit `server/routes.ts` line 9:
```typescript
const AUTHORIZED_USER_ID = "YOUR_USER_ID_HERE";
```

### 4. Replit Deployment

1. Fork this project to your Replit account
2. Set environment variables in Replit Secrets
3. Connect your Neon PostgreSQL database
4. Enable Replit Auth in your project settings
5. Run the application

### 5. Database Setup

The application uses PostgreSQL with the following tables:
- `users` - User authentication and preferences
- `sessions` - Authentication session storage
- `financial_data` - All financial calculations and data

Schema is managed by Drizzle ORM with automatic migrations.

### 6. Customization

#### Quick-Add Values
Edit `client/src/components/quick-add-shortcuts.tsx` to modify preset income/expense values.

#### Themes
Modify color themes in `client/src/index.css` under the theme color variations section.

#### Currency
The app is configured for Australian dollars. To change currency, update:
- `client/src/components/cash-calculator.tsx` - denomination values
- `client/src/lib/utils.ts` - formatCurrency function

### 7. Export Features

The application includes Excel and PDF export capabilities:
- Excel exports create multi-sheet workbooks
- PDF exports generate formatted financial reports
- Both include summary data and detailed breakdowns

### 8. PWA Configuration

The app is configured as a Progressive Web App:
- Custom FINTRAK branding and icons
- Offline functionality
- Mobile app installation
- Service worker for caching

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify DATABASE_URL is correct
- Check network connectivity to database host
- Ensure database exists and user has proper permissions

**Authentication Errors**
- Confirm Replit Auth is enabled in project settings
- Check user ID matches AUTHORIZED_USER_ID constant
- Verify session storage is working

**Build Errors**
- Run `npm install` to ensure dependencies are current
- Check for TypeScript errors with `npm run type-check`
- Verify all file paths and imports are correct

**Mobile Issues**
- Test on actual devices, not just browser dev tools
- Verify touch targets are properly sized (44px minimum)
- Check iOS-specific optimizations are applied

### Development Tips

1. **Hot Reload**: Vite provides instant updates during development
2. **TypeScript**: Use strict typing for better development experience  
3. **Component Development**: Build components in isolation first
4. **Mobile Testing**: Test on real devices frequently
5. **Performance**: Monitor bundle size and loading times

### Production Considerations

1. **Database**: Use connection pooling for production loads
2. **Authentication**: Consider rate limiting and session timeouts
3. **Monitoring**: Implement proper logging and error tracking
4. **Backup**: Regular database backups for financial data
5. **Security**: Regular security audits and dependency updates

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review console logs for error details
3. Verify all environment variables are set correctly
4. Test with a fresh database schema if needed

---

Happy coding! 🚀