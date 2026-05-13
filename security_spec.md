# Firebase Security Specification - Sistem Akademik

## 1. Data Invariants
- Mahasiswa must have a unique NIM and valid email.
- Dosen must have a unique NIDN and valid email.
- Mata Kuliah must have a positive SKS value.
- Jadwal must reference existing Mata Kuliah, Dosen, and Kelas.
- Timestamps (createdAt, updatedAt) must be server-generated.

## 2. The "Dirty Dozen" Payloads (Denial Tests)
1. **Identity Spoofing**: Attempt to create a Mahasiswa with an `ownerId` field set to another user.
2. **Path Poisoning**: Attempt to write to `mahasiswa/1.5kb-long-garbage-string`.
3. **Ghost Field Injection**: Attempt to add `isAdmin: true` to a Mahasiswa document.
4. **Timestamp Forgery**: Attempt to manually set `createdAt` to a past date.
5. **Terminal State Bypass**: Attempt to update a document after it has been marked "Lulus" (if terminal logic applied).
6. **Relational Orphan**: Attempt to create a Jadwal referencing a non-existent matakuliah ID.
7. **Size Exhaustion**: Attempt to write a 1MB string into the `deskripsi` field of Matakuliah.
8. **PII Leak**: Attempt to read the entire `mahasiswa` collection without authentication.
9. **Email Spoofing**: Attempt to perform admin actions with an unverified email (if admin logic uses email).
10. **Type Mismatch**: Attempt to set `semester` as a string instead of an integer.
11. **Shadow Update**: Attempt to update `nim` (which should be immutable).
12. **Blanket Read**: Attempt a list query on `dosen` without any filters as a guest.

## 3. Security Principles
- All writes require authentication.
- Schema validation for every entity.
- Immutability for key identifiers (NIM, NIDN, Kode Matkul).
- Server-side timestamp verification.
