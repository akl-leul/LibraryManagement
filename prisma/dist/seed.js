"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = require("bcryptjs");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        // Helper to hash password
        function hashPassword(password) {
            return __awaiter(this, void 0, void 0, function () {
                var salt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
                        case 1:
                            salt = _a.sent();
                            return [2 /*return*/, bcryptjs_1.default.hash(password, salt)];
                    }
                });
            });
        }
        var adminPassword, librarianPassword, studentPassword, admin, librarian, student, books, allBooks, book2025;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Start seeding...");
                    // Clear existing data
                    return [4 /*yield*/, prisma.borrowing.deleteMany()];
                case 1:
                    // Clear existing data
                    _a.sent();
                    return [4 /*yield*/, prisma.book.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, hashPassword("admin123")];
                case 4:
                    adminPassword = _a.sent();
                    return [4 /*yield*/, hashPassword("librarian123")];
                case 5:
                    librarianPassword = _a.sent();
                    return [4 /*yield*/, hashPassword("student123")];
                case 6:
                    studentPassword = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: "Admin User",
                                email: "admin@example.com",
                                password: adminPassword,
                                role: client_1.Role.ADMIN,
                            },
                        })];
                case 7:
                    admin = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: "Librarian User",
                                email: "librarian@example.com",
                                password: librarianPassword,
                                role: client_1.Role.LIBRARIAN,
                            },
                        })];
                case 8:
                    librarian = _a.sent();
                    return [4 /*yield*/, prisma.user.create({
                            data: {
                                name: "Student User",
                                email: "student@example.com",
                                password: studentPassword,
                                role: client_1.Role.STUDENT,
                            },
                        })];
                case 9:
                    student = _a.sent();
                    return [4 /*yield*/, prisma.book.createMany({
                            data: [
                                {
                                    title: "The Great Gatsby",
                                    author: "F. Scott Fitzgerald",
                                    isbn: "9780743273565",
                                    category: "Fiction",
                                    available: true,
                                },
                                {
                                    title: "2025",
                                    author: "George Orwell",
                                    isbn: "9780451524935",
                                    category: "Dystopian",
                                    available: true,
                                },
                                {
                                    title: "To Kill a Mockingbird",
                                    author: "Harper Lee",
                                    isbn: "9780060935467",
                                    category: "Fiction",
                                    available: true,
                                },
                                {
                                    title: "Clean Code",
                                    author: "Robert C. Martin",
                                    isbn: "9780132350884",
                                    category: "Programming",
                                    available: true,
                                },
                            ],
                        })];
                case 10:
                    books = _a.sent();
                    return [4 /*yield*/, prisma.book.findMany()];
                case 11:
                    allBooks = _a.sent();
                    book2025 = allBooks.find(function (b) { return b.title === "2025"; });
                    if (!book2025) return [3 /*break*/, 14];
                    return [4 /*yield*/, prisma.borrowing.create({
                            data: {
                                userId: student.id,
                                bookId: book2025.id,
                                borrowedAt: new Date(),
                                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                            },
                        })];
                case 12:
                    _a.sent();
                    // Mark book as unavailable
                    return [4 /*yield*/, prisma.book.update({
                            where: { id: book2025.id },
                            data: { available: false },
                        })];
                case 13:
                    // Mark book as unavailable
                    _a.sent();
                    _a.label = 14;
                case 14:
                    console.log("Seeding finished.");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
