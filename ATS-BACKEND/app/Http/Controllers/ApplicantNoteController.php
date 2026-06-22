<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\ApplicantNote;
use Illuminate\Http\Request;

class ApplicantNoteController extends Controller
{
    public function index(Applicant $applicant)
    {
        return $applicant->notes()->with('user')->latest()->get();
    }

    public function store(Request $request, Applicant $applicant)
    {
        $data = $request->validate([
            'note' => ['required', 'string', 'max:4000'],
        ]);

        // Sanitize note to prevent XSS attacks
        $sanitizedNote = strip_tags($data['note'], '<p><br><strong><em><ul><ol><li>');

        $note = ApplicantNote::create([
            'applicant_id' => $applicant->id,
            'user_id' => $request->user()->id,
            'note' => $sanitizedNote,
        ]);

        return response()->json($note->load('user'), 201);
    }

    public function update(Request $request, Applicant $applicant, ApplicantNote $note)
    {
        // Ensure the note belongs to the applicant (defense-in-depth beyond route binding)
        if ($note->applicant_id !== $applicant->id) {
            return response()->json(['message' => 'Note not found for this applicant.'], 404);
        }

        $data = $request->validate([
            'note' => ['required', 'string', 'max:4000'],
        ]);

        $sanitizedNote = strip_tags($data['note'], '<p><br><strong><em><ul><ol><li>');
        $note->update(['note' => $sanitizedNote]);

        return response()->json($note->load('user'));
    }

    public function destroy(Applicant $applicant, ApplicantNote $note)
    {
        if ($note->applicant_id !== $applicant->id) {
            return response()->json(['message' => 'Note not found for this applicant.'], 404);
        }

        $note->delete();

        return response()->json(['message' => 'Note deleted successfully.']);
    }
}
