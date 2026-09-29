import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose, { Schema, Document } from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

dotenv.config();

// ============================================================================
// Mongoose Schemas & Models (MongoDB Integration)
// ============================================================================

export interface IUser extends Document {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: 'employee' | 'visitor' | 'student';
  companyOrCollege: string;
  designationOrCourse?: string;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['employee', 'visitor', 'student'], required: true },
    companyOrCollege: { type: String, required: true, trim: true },
    designationOrCourse: { type: String, default: '' },
  },
  { timestamps: true }
);

export interface IVisitor extends Document {
  name: string;
  mobileNumber: string;
  companyOrCollege: string;
  personToMeet: string;
  purposeOfVisit: string;
  dateTime: Date;
  visitorCategory: 'Visitor' | 'Student' | 'Employee';
  createdByUserId?: string;
}

const VisitorSchema = new Schema<IVisitor>(
  {
    name: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    companyOrCollege: { type: String, required: true, trim: true },
    personToMeet: { type: String, required: true, trim: true },
    purposeOfVisit: { type: String, required: true, trim: true },
    dateTime: { type: Date, default: Date.now },
    visitorCategory: {
      type: String,
      enum: ['Visitor', 'Student', 'Employee'],
      default: 'Visitor',
    },
    createdByUserId: { type: String, default: '' },
  },
  { timestamps: true }
);

const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
const VisitorModel = mongoose.models.Visitor || mongoose.model<IVisitor>('Visitor', VisitorSchema);

// ============================================================================
// Persistent JSON Store Fallback (Ensures zero-config reliability if MongoDB daemon isn't local)
// ============================================================================

interface StoredUser {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
  role: 'employee' | 'visitor' | 'student';
  companyOrCollege: string;
  designationOrCourse?: string;
}

interface StoredVisitor {
  _id: string;
  name: string;
  mobileNumber: string;
  companyOrCollege: string;
  personToMeet: string;
  purposeOfVisit: string;
  dateTime: string;
  visitorCategory: 'Visitor' | 'Student' | 'Employee';
  createdByUserId?: string;
}

interface LocalDatabase {
  users: StoredUser[];
  visitors: StoredVisitor[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'visitor_register.json');

function getInitialSeedData(): LocalDatabase {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const threeHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 50 * 60 * 60 * 1000);

  return {
    users: [
      {
        id: 'usr-emp-1',
        name: 'Priya Sharma',
        email: 'employee@company.com',
        mobileNumber: '9876543210',
        password: 'password123',
        role: 'employee',
        companyOrCollege: 'NexaCorp Technologies HQ',
        designationOrCourse: 'Front Desk Receptionist & Admin',
      },
      {
        id: 'usr-vis-1',
        name: 'Vikramjit Sen',
        email: 'visitor@client.com',
        mobileNumber: '9820114455',
        password: 'password123',
        role: 'visitor',
        companyOrCollege: 'Apex Logistics Pvt. Ltd.',
        designationOrCourse: 'Operations Consultant',
      },
      {
        id: 'usr-stu-1',
        name: 'Ananya Chatterjee',
        email: 'student@college.edu',
        mobileNumber: '9123456789',
        password: 'password123',
        role: 'student',
        companyOrCollege: 'Indian Institute of Engineering & Science',
        designationOrCourse: 'B.Tech Computer Science (Final Year)',
      },
    ],
    visitors: [
      {
        _id: 'vis-1001',
        name: 'Ananya Chatterjee',
        mobileNumber: '9123456789',
        companyOrCollege: 'Indian Institute of Engineering & Science',
        personToMeet: 'Siddharth Verma (Engineering Lead)',
        purposeOfVisit: 'Final Year Capstone Project Review & Internship Interview',
        dateTime: oneHourAgo.toISOString(),
        visitorCategory: 'Student',
        createdByUserId: 'usr-stu-1',
      },
      {
        _id: 'vis-1002',
        name: 'Vikramjit Sen',
        mobileNumber: '9820114455',
        companyOrCollege: 'Apex Logistics Pvt. Ltd.',
        personToMeet: 'Meera Krishnan (VP Operations)',
        purposeOfVisit: 'Quarterly Supply Chain Vendor Agreement Discussion',
        dateTime: twoHoursAgo.toISOString(),
        visitorCategory: 'Visitor',
        createdByUserId: 'usr-vis-1',
      },
      {
        _id: 'vis-1003',
        name: 'Rohan Deshmukh',
        mobileNumber: '9765432109',
        companyOrCollege: 'St. Xavier Institute of Technology',
        personToMeet: 'Neha Kapoor (HR Manager)',
        purposeOfVisit: 'Campus Placement Document Verification',
        dateTime: threeHoursAgo.toISOString(),
        visitorCategory: 'Student',
        createdByUserId: 'usr-emp-1',
      },
      {
        _id: 'vis-1004',
        name: 'Karthik Nair',
        mobileNumber: '9988776655',
        companyOrCollege: 'CloudScale Solutions',
        personToMeet: 'Arjun Mehta (CTO)',
        purposeOfVisit: 'Enterprise Security Architecture Audit',
        dateTime: yesterday.toISOString(),
        visitorCategory: 'Visitor',
        createdByUserId: 'usr-emp-1',
      },
      {
        _id: 'vis-1005',
        name: 'Sneha Kulkarni',
        mobileNumber: '9445566778',
        companyOrCollege: 'National Institute of Design',
        personToMeet: 'Divya Rao (Product Design Head)',
        purposeOfVisit: 'UI/UX Portfolio Presentation & Design Critique',
        dateTime: twoDaysAgo.toISOString(),
        visitorCategory: 'Student',
        createdByUserId: 'usr-emp-1',
      },
    ],
  };
}

function readLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const seed = getInitialSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as LocalDatabase;
    if (!parsed.users || !parsed.visitors) {
      const seed = getInitialSeedData();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    return parsed;
  } catch {
    return getInitialSeedData();
  }
}

function writeLocalDb(db: LocalDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local DB file:', err);
  }
}

function isSameLocalDay(isoDateString: string, referenceDate: Date): boolean {
  const d = new Date(isoDateString);
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth() &&
    d.getDate() === referenceDate.getDate()
  );
}

// ============================================================================
// Server Initialization
// ============================================================================

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  let isMongoConnected = false;
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri !== 'mongodb://localhost:27017/visitor_registration_db') {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      isMongoConnected = true;
      console.log('Connected to MongoDB via Mongoose');
    } catch {
      console.log('MongoDB URI unreachable, using persistent JSON storage repository');
      isMongoConnected = false;
    }
  } else {
    // Initialize local JSON database with seed records
    readLocalDb();
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATION REST APIs (Employee, Visitor, Student Login & Registration)
  // --------------------------------------------------------------------------

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { identifier, password, role } = req.body as {
        identifier?: string;
        password?: string;
        role?: 'employee' | 'visitor' | 'student';
      };

      if (!identifier || !password) {
        res.status(400).json({ error: 'Please provide your email/mobile number and password.' });
        return;
      }

      const cleanId = identifier.trim().toLowerCase();

      if (isMongoConnected) {
        const query: Record<string, unknown> = {
          $or: [{ email: cleanId }, { mobileNumber: cleanId }],
        };
        if (role) query.role = role;

        const user = await UserModel.findOne(query).lean();
        if (!user || user.password !== password) {
          res.status(401).json({ error: 'Invalid credentials or role mismatch. Please try again.' });
          return;
        }

        res.json({
          user: {
            id: String(user._id),
            name: user.name,
            email: user.email,
            mobileNumber: user.mobileNumber,
            role: user.role,
            companyOrCollege: user.companyOrCollege,
            designationOrCourse: user.designationOrCourse || '',
          },
        });
        return;
      }

      const db = readLocalDb();
      const matchedUser = db.users.find((u) => {
        const idMatches =
          u.email.toLowerCase() === cleanId || u.mobileNumber.trim() === cleanId;
        const roleMatches = role ? u.role === role : true;
        return idMatches && roleMatches && u.password === password;
      });

      if (!matchedUser) {
        res.status(401).json({
          error: 'Invalid email/mobile, password, or selected role. Use the quick demo accounts or register a new account.',
        });
        return;
      }

      res.json({
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          mobileNumber: matchedUser.mobileNumber,
          role: matchedUser.role,
          companyOrCollege: matchedUser.companyOrCollege,
          designationOrCourse: matchedUser.designationOrCourse || '',
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Authentication failed due to server error.' });
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        mobileNumber,
        password,
        role,
        companyOrCollege,
        designationOrCourse,
      } = req.body as {
        name?: string;
        email?: string;
        mobileNumber?: string;
        password?: string;
        role?: 'employee' | 'visitor' | 'student';
        companyOrCollege?: string;
        designationOrCourse?: string;
      };

      if (!name || !email || !mobileNumber || !password || !role || !companyOrCollege) {
        res.status(400).json({ error: 'All required fields must be filled to register.' });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (isMongoConnected) {
        const existing = await UserModel.findOne({ email: normalizedEmail });
        if (existing) {
          res.status(409).json({ error: 'An account with this email already exists.' });
          return;
        }
        const created = await UserModel.create({
          name: name.trim(),
          email: normalizedEmail,
          mobileNumber: mobileNumber.trim(),
          password,
          role,
          companyOrCollege: companyOrCollege.trim(),
          designationOrCourse: (designationOrCourse || '').trim(),
        });
        res.status(201).json({
          user: {
            id: String(created._id),
            name: created.name,
            email: created.email,
            mobileNumber: created.mobileNumber,
            role: created.role,
            companyOrCollege: created.companyOrCollege,
            designationOrCourse: created.designationOrCourse,
          },
        });
        return;
      }

      const db = readLocalDb();
      if (db.users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        res.status(409).json({ error: 'An account with this email already exists.' });
        return;
      }

      const newUser: StoredUser = {
        id: `usr-${crypto.randomUUID().slice(0, 8)}`,
        name: name.trim(),
        email: normalizedEmail,
        mobileNumber: mobileNumber.trim(),
        password,
        role,
        companyOrCollege: companyOrCollege.trim(),
        designationOrCourse: (designationOrCourse || '').trim(),
      };

      db.users.push(newUser);
      writeLocalDb(db);

      res.status(201).json({
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          mobileNumber: newUser.mobileNumber,
          role: newUser.role,
          companyOrCollege: newUser.companyOrCollege,
          designationOrCourse: newUser.designationOrCourse,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user account.' });
    }
  });

  // --------------------------------------------------------------------------
  // VISITOR CRUD REST APIs
  // --------------------------------------------------------------------------

  // 1. View all visitor records & Search visitor by name or mobile number
  app.get('/api/visitors', async (req: Request, res: Response) => {
    try {
      const search = ((req.query.search as string) || '').trim().toLowerCase();
      const now = new Date();

      if (isMongoConnected) {
        const allDocs = await VisitorModel.find().sort({ dateTime: -1 }).lean();
        const formatted: StoredVisitor[] = allDocs.map((doc) => ({
          _id: String(doc._id),
          name: doc.name,
          mobileNumber: doc.mobileNumber,
          companyOrCollege: doc.companyOrCollege,
          personToMeet: doc.personToMeet,
          purposeOfVisit: doc.purposeOfVisit,
          dateTime: new Date(doc.dateTime).toISOString(),
          visitorCategory: doc.visitorCategory || 'Visitor',
          createdByUserId: doc.createdByUserId || '',
        }));

        const todayCount = formatted.filter((v) => isSameLocalDay(v.dateTime, now)).length;
        const filtered = search
          ? formatted.filter(
              (v) =>
                v.name.toLowerCase().includes(search) ||
                v.mobileNumber.toLowerCase().includes(search)
            )
          : formatted;

        res.json({
          visitors: filtered,
          todayCount,
          totalCount: formatted.length,
        });
        return;
      }

      const db = readLocalDb();
      const sorted = [...db.visitors].sort(
        (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
      );

      const todayCount = sorted.filter((v) => isSameLocalDay(v.dateTime, now)).length;
      const filtered = search
        ? sorted.filter(
            (v) =>
              v.name.toLowerCase().includes(search) ||
              v.mobileNumber.toLowerCase().includes(search)
          )
        : sorted;

      res.json({
        visitors: filtered,
        todayCount,
        totalCount: sorted.length,
      });
    } catch (error) {
      console.error('Error fetching visitors:', error);
      res.status(500).json({ error: 'Failed to fetch visitor records.' });
    }
  });

  // 2. Add a new visitor (Date & Time auto-captured)
  app.post('/api/visitors', async (req: Request, res: Response) => {
    try {
      const {
        name,
        mobileNumber,
        companyOrCollege,
        personToMeet,
        purposeOfVisit,
        visitorCategory,
        createdByUserId,
      } = req.body as {
        name?: string;
        mobileNumber?: string;
        companyOrCollege?: string;
        personToMeet?: string;
        purposeOfVisit?: string;
        visitorCategory?: 'Visitor' | 'Student' | 'Employee';
        createdByUserId?: string;
      };

      if (!name || !mobileNumber || !companyOrCollege || !personToMeet || !purposeOfVisit) {
        res.status(400).json({
          error:
            'Name, Mobile Number, Company/College Name, Person to Meet, and Purpose of Visit are all required.',
        });
        return;
      }

      const autoTimestamp = new Date();

      if (isMongoConnected) {
        const created = await VisitorModel.create({
          name: name.trim(),
          mobileNumber: mobileNumber.trim(),
          companyOrCollege: companyOrCollege.trim(),
          personToMeet: personToMeet.trim(),
          purposeOfVisit: purposeOfVisit.trim(),
          dateTime: autoTimestamp,
          visitorCategory: visitorCategory || 'Visitor',
          createdByUserId: createdByUserId || '',
        });

        res.status(201).json({
          visitor: {
            _id: String(created._id),
            name: created.name,
            mobileNumber: created.mobileNumber,
            companyOrCollege: created.companyOrCollege,
            personToMeet: created.personToMeet,
            purposeOfVisit: created.purposeOfVisit,
            dateTime: created.dateTime.toISOString(),
            visitorCategory: created.visitorCategory,
            createdByUserId: created.createdByUserId,
          },
        });
        return;
      }

      const db = readLocalDb();
      const newVisitor: StoredVisitor = {
        _id: `vis-${crypto.randomUUID().slice(0, 8)}`,
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        companyOrCollege: companyOrCollege.trim(),
        personToMeet: personToMeet.trim(),
        purposeOfVisit: purposeOfVisit.trim(),
        dateTime: autoTimestamp.toISOString(),
        visitorCategory: visitorCategory || 'Visitor',
        createdByUserId: createdByUserId || '',
      };

      db.visitors.unshift(newVisitor);
      writeLocalDb(db);

      res.status(201).json({ visitor: newVisitor });
    } catch (error) {
      console.error('Error adding visitor:', error);
      res.status(500).json({ error: 'Failed to add visitor record.' });
    }
  });

  // 3. Edit visitor details
  app.put('/api/visitors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        name,
        mobileNumber,
        companyOrCollege,
        personToMeet,
        purposeOfVisit,
        visitorCategory,
      } = req.body as {
        name?: string;
        mobileNumber?: string;
        companyOrCollege?: string;
        personToMeet?: string;
        purposeOfVisit?: string;
        visitorCategory?: 'Visitor' | 'Student' | 'Employee';
      };

      if (!name || !mobileNumber || !companyOrCollege || !personToMeet || !purposeOfVisit) {
        res.status(400).json({
          error:
            'Name, Mobile Number, Company/College Name, Person to Meet, and Purpose of Visit are required.',
        });
        return;
      }

      if (isMongoConnected) {
        const updated = await VisitorModel.findByIdAndUpdate(
          id,
          {
            name: name.trim(),
            mobileNumber: mobileNumber.trim(),
            companyOrCollege: companyOrCollege.trim(),
            personToMeet: personToMeet.trim(),
            purposeOfVisit: purposeOfVisit.trim(),
            ...(visitorCategory ? { visitorCategory } : {}),
          },
          { new: true }
        ).lean();

        if (!updated) {
          res.status(404).json({ error: 'Visitor record not found.' });
          return;
        }

        res.json({
          visitor: {
            _id: String(updated._id),
            name: updated.name,
            mobileNumber: updated.mobileNumber,
            companyOrCollege: updated.companyOrCollege,
            personToMeet: updated.personToMeet,
            purposeOfVisit: updated.purposeOfVisit,
            dateTime: new Date(updated.dateTime).toISOString(),
            visitorCategory: updated.visitorCategory || 'Visitor',
            createdByUserId: updated.createdByUserId || '',
          },
        });
        return;
      }

      const db = readLocalDb();
      const idx = db.visitors.findIndex((v) => v._id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'Visitor record not found.' });
        return;
      }

      db.visitors[idx] = {
        ...db.visitors[idx],
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        companyOrCollege: companyOrCollege.trim(),
        personToMeet: personToMeet.trim(),
        purposeOfVisit: purposeOfVisit.trim(),
        visitorCategory: visitorCategory || db.visitors[idx].visitorCategory,
      };

      writeLocalDb(db);
      res.json({ visitor: db.visitors[idx] });
    } catch (error) {
      console.error('Error updating visitor:', error);
      res.status(500).json({ error: 'Failed to update visitor record.' });
    }
  });

  // 4. Delete visitor record
  app.delete('/api/visitors/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (isMongoConnected) {
        const deleted = await VisitorModel.findByIdAndDelete(id);
        if (!deleted) {
          res.status(404).json({ error: 'Visitor record not found.' });
          return;
        }
        res.json({ success: true, deletedId: id });
        return;
      }

      const db = readLocalDb();
      const initialLength = db.visitors.length;
      db.visitors = db.visitors.filter((v) => v._id !== id);

      if (db.visitors.length === initialLength) {
        res.status(404).json({ error: 'Visitor record not found.' });
        return;
      }

      writeLocalDb(db);
      res.json({ success: true, deletedId: id });
    } catch (error) {
      console.error('Error deleting visitor:', error);
      res.status(500).json({ error: 'Failed to delete visitor record.' });
    }
  });

  // --------------------------------------------------------------------------
  // Vite Middleware (Development) & Static Serving (Production)
  // --------------------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Visitor Registration System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
