from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_conversation_consultant'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conversation',
            name='consultant',
            field=models.CharField(
                choices=[
                    ('business', 'Бизнес-консультант'),
                    ('legal', 'Юридический консультант'),
                    ('hybrid', 'Бизнес + Юридический'),
                ],
                default='business',
                max_length=20,
            ),
        ),
    ]