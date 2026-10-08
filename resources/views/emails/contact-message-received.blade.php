<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New Contact Message</title>
</head>
<body>

    <h2>New Contact Message</h2>

    <p><strong>Name:</strong> {{ $contactMessage->name }}</p>

    <p><strong>Email:</strong> {{ $contactMessage->email }}</p>

    <p><strong>Phone:</strong> {{ $contactMessage->phone ?? 'Not provided' }}</p>

    <p><strong>Subject:</strong> {{ $contactMessage->subject ?? 'No subject' }}</p>

    <p><strong>Message:</strong></p>

    <p>{{ $contactMessage->body }}</p>

</body>
</html>
