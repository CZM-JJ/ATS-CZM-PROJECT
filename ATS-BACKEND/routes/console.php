<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Prune expired Sanctum tokens daily so the DB stays clean
Schedule::command('sanctum:prune-expired --hours=8')->daily();

// Check applicant CVs: reports applicants with missing cv_path or missing files on configured disk
Artisan::command('cv:check', function () {
    $this->comment('Checking applicant CVs...');
    $disk = config('filesystems.cv_disk', 'public');
    $missingPath = [];
    $missingFile = [];

    App\Models\Applicant::select('id', 'first_name', 'last_name', 'cv_path')->chunk(100, function ($applicants) use (&$missingPath, &$missingFile, $disk) {
        foreach ($applicants as $a) {
            if (empty($a->cv_path)) {
                $missingPath[] = $a->id;

                continue;
            }
            try {
                if (! \Illuminate\Support\Facades\Storage::disk($disk)->exists($a->cv_path)) {
                    $missingFile[] = ['id' => $a->id, 'cv_path' => $a->cv_path];
                }
            } catch (Throwable $e) {
                $this->error("Error checking applicant {$a->id}: ".$e->getMessage());
            }
        }
    });

    $this->info('Disk: '.$disk);
    $this->info('Applicants with no cv_path: '.count($missingPath));
    if (! empty($missingPath)) {
        $this->line(implode(', ', $missingPath));
    }
    $this->info('Applicants with cv_path but file missing: '.count($missingFile));
    foreach ($missingFile as $m) {
        $this->line("- {$m['id']}: {$m['cv_path']}");
    }
})->purpose('Report applicants missing CV paths or missing files on storage');

// Bulk re-upload CVs from a local directory. Usage: php artisan cv:reupload path/to/dir --pattern=applicant_{id}
Artisan::command('cv:reupload {dir} {--pattern=applicant_{id}} {--disk=}', function ($dir) {
    $pattern = $this->option('pattern') ?? 'applicant_{id}';
    $disk = $this->option('disk') ?: config('filesystems.cv_disk', 'public');
    $this->comment("Uploading CVs from: $dir using pattern: $pattern to disk: $disk");

    if (! is_dir($dir)) {
        $this->error('Directory not found: '.$dir);

        return 1;
    }

    $files = scandir($dir);
    $uploaded = 0;
    foreach ($files as $file) {
        if (in_array($file, ['.', '..'])) {
            continue;
        }
        // try to extract applicant id from filename using pattern
        // pattern example: applicant_{id} => filename must contain the id in place of {id}
        // fallback: try to find a numeric segment in filename
        $id = null;
        if (strpos($pattern, '{id}') !== false) {
            // build regex from pattern
            $regex = '/^'.str_replace('\{id\}', '(?P<id>\\d+)', preg_quote($pattern, '/')).'/i';
            if (preg_match($regex, pathinfo($file, PATHINFO_FILENAME), $m) && ! empty($m['id'])) {
                $id = (int) $m['id'];
            }
        }
        if (! $id) {
            // try to find first number in filename
            if (preg_match('/(\\d{1,6})/', $file, $m)) {
                $id = (int) $m[1];
            }
        }
        if (! $id) {
            continue;
        }

        $applicant = App\Models\Applicant::find($id);
        if (! $applicant) {
            continue;
        }

        $path = 'cvs/'.basename($file);
        try {
            $stream = fopen(rtrim($dir, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$file, 'r');
            if ($stream === false) {
                continue;
            }
            \Illuminate\Support\Facades\Storage::disk($disk)->put($path, $stream);
            fclose($stream);
            $applicant->cv_path = $path;
            $applicant->save();
            $uploaded++;
            $this->line("Uploaded for applicant {$id} -> {$path}");
        } catch (Throwable $e) {
            $this->error("Failed to upload {$file} for applicant {$id}: ".$e->getMessage());
        }
    }

    $this->info('Uploaded: '.$uploaded);

})->describe('Bulk re-upload CV files by applicant id parsed from filename');
