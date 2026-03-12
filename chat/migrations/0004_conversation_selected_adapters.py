from django.db import migrations, models


def fill_selected_adapters(apps, schema_editor):
    Conversation = apps.get_model('chat', 'Conversation')
    mapping = {
        'business': '["business"]',
        'legal': '["legal"]',
        'psych': '["psych"]',
        'hybrid': '["business", "legal"]',
    }
    for conversation in Conversation.objects.all():
        conversation.selected_adapters = mapping.get(conversation.consultant, '["business"]')
        conversation.save(update_fields=['selected_adapters'])


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0003_alter_conversation_consultant'),
    ]

    operations = [
        migrations.AddField(
            model_name='conversation',
            name='selected_adapters',
            field=models.TextField(blank=True, default='["business"]'),
        ),
        migrations.AlterField(
            model_name='conversation',
            name='consultant',
            field=models.CharField(choices=[('business', 'Бизнес-консультант'), ('legal', 'Юридический консультант'), ('psych', 'Предпринимательский психолог'), ('hybrid', 'Бизнес + Юридический'), ('custom', 'Кастомный гибрид')], default='business', max_length=20),
        ),
        migrations.RunPython(fill_selected_adapters, migrations.RunPython.noop),
    ]
